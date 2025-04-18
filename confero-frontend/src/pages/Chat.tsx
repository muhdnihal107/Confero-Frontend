import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchChatGroups, fetchMessages, createChatGroup, sendMessage } from '../api/chat';
import { fetchFriends } from '../api/auth';
import { useAuthStore } from '../Store/authStore';
import { useChatStore } from '../Store/ChatStore';
import { ChatGroup, Message } from '../api/chat';
import { ProfileResponse } from '../api/auth';
import Header from '../components/Header';

const Chat: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const { currentGroup, messages, setCurrentGroup, addMessage, connectWebSocket, disconnectWebSocket } = useChatStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch friends
  const { data: friends, isLoading: friendsLoading } = useQuery<ProfileResponse[]>({
    queryKey: ['friends'],
    queryFn: fetchFriends,
    enabled: !!accessToken,
  });

  // Fetch chat groups
  const { data: groups, isLoading: groupsLoading } = useQuery<ChatGroup[]>({
    queryKey: ['chatGroups'],
    queryFn: () => fetchChatGroups(accessToken!),
    enabled: !!accessToken,
  });

  // Restore currentGroup from localStorage when groups are available
  useEffect(() => {
    if (!accessToken || !user || !groups || currentGroup) return;
    const savedGroupId = localStorage.getItem('currentGroupId');
    if (savedGroupId) {
      const savedGroup = groups.find((group) => group.id === savedGroupId);
      if (savedGroup) {
        setCurrentGroup(savedGroup);
      }
    }
  }, [accessToken, user, groups, currentGroup, setCurrentGroup]);

  // Save currentGroup to localStorage
  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem('currentGroupId', currentGroup.id);
    }
  }, [currentGroup]);

  // Fetch messages for current group
  const { data: fetchedMessages, isLoading: messagesLoading, error, isError } = useQuery<Message[]>({
    queryKey: ['messages', currentGroup?.id],
    queryFn: () => fetchMessages(currentGroup!.id, accessToken!),
    enabled: !!accessToken && !!currentGroup,
    refetchOnMount: 'always',
  });

  // Log errors from useQuery
  useEffect(() => {
    if (isError && error) {
      console.error('Message fetch error:', error);
    }
  }, [isError, error]);

  // Add fetched messages to store
  useEffect(() => {
    if (fetchedMessages && Array.isArray(fetchedMessages)) {
      fetchedMessages.forEach((msg: Message) => {
        if (!useChatStore.getState().messages.some((existing) => existing.id === msg.id)) {
          useChatStore.getState().addMessage(msg);
        }
      });
    }
  }, [fetchedMessages]);

  // Invalidate messages query on new WebSocket message
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      if (state.messages.length > prevState.messages.length && currentGroup) {
        queryClient.invalidateQueries(['messages', currentGroup.id]);
      }
    });
    return () => unsubscribe();
  }, [currentGroup, queryClient]);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (currentGroup && accessToken) {
      connectWebSocket(currentGroup.id, accessToken);
      return () => disconnectWebSocket();
    }
  }, [currentGroup, accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectFriend = async (friend: ProfileResponse) => {
    if (!accessToken || !user) return;

    // Clear messages before switching group
    useChatStore.getState().setMessages([]);

    const existingGroup = groups?.find(
      (group) =>
        !group.is_group_chat &&
        group.participants.length === 2 &&
        group.participants.includes(user.email) &&
        group.participants.includes(friend.email)
    );

    if (existingGroup) {
      setCurrentGroup(existingGroup);
      queryClient.invalidateQueries(['messages', existingGroup.id]);
    } else {
      try {
        const newGroup = await createChatGroup(
          {
            is_group_chat: false,
            participants: [user.email, friend.email],
          },
          accessToken
        );
        setCurrentGroup(newGroup);
        queryClient.invalidateQueries(['messages', newGroup.id]);
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!currentGroup || !accessToken || isSending) return;
    setIsSending(true);
    try {
      if (messageText.trim()) {
        await sendMessage(
          { chat_group: currentGroup.id, message_type: 'text', content: messageText },
          accessToken
        );
        setMessageText('');
      }
      if (file) {
        const messageType = file.type.startsWith('image/') ? 'image' : 'video';
        await sendMessage(
          { chat_group: currentGroup.id, message_type: messageType, media_file: file },
          accessToken
        );
        setFile(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getDisplayName = (email: string): string => {
    return email.split('@')[0];
  };

  const getFriendDetails = () => {
    if (!currentGroup || !user) return null;
    const friendEmail = currentGroup.participants.find((email) => email !== user.email);
    return friends?.find((friend) => friend.email === friendEmail) || null;
  };

  if (friendsLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-white text-2xl font-semibold animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Header />
      <main className="flex-grow max-w-[1400px] mt-16 mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-4">
        <aside className="w-full lg:w-80 bg-gray-900 rounded-2xl p-4 shadow-xl border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Friends</h2>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-2">
            {friends && friends.length > 0 ? (
              friends.map((friend) => (
                <button
                  key={friend.user_id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-300 ${
                    currentGroup?.participants.includes(friend.email)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {friend.profile_photo ? (
                    <img
                      src={`http://localhost:8000${friend.profile_photo}`}
                      alt={friend.username || friend.email}
                      className="w-10 h-10 rounded-full object-cover mr-3 ring-2 ring-indigo-600/20"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3 ring-2 ring-gray-600/20">
                      <span className="text-white font-semibold">
                        {(friend.username || friend.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold">{friend.username || getDisplayName(friend.email)}</p>
                    <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-gray-400 text-center">No friends yet.</p>
            )}
          </div>
        </aside>
        <section className="flex-grow bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-800 flex flex-col">
          {currentGroup ? (
            <>
              <div className="flex items-center mb-6">
                {getFriendDetails()?.profile_photo ? (
                  <img
                    src={`http://localhost:8000${getFriendDetails()?.profile_photo}`}
                    alt={getFriendDetails()?.username || getFriendDetails()?.email}
                    className="w-12 h-12 rounded-full object-cover mr-3 ring-2 ring-indigo-600/30"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-3 ring-2 ring-gray-600/30">
                    <span className="text-white font-semibold">
                      {(getFriendDetails()?.username || getFriendDetails()?.email)?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {getFriendDetails()?.username ||
                    getDisplayName(currentGroup.participants.find((email) => email !== user?.email) || '')}
                </h2>
              </div>
              <div className="flex-grow overflow-y-auto mb-4 max-h-[calc(100vh-300px)] bg-gray-850 rounded-lg p-4">
                {messagesLoading ? (
                  <p className="text-gray-400 text-center">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-gray-400 text-center">Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${msg.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3 rounded-2xl shadow-md ${
                          msg.sender_email === user?.email
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        {msg.message_type === 'text' && <p>{msg.content}</p>}
                        {msg.message_type === 'image' && (
                          <img
                            src={`http://localhost:8002${msg.media_file}`}
                            alt="Chat image"
                            className="w-60 h-auto rounded-lg"
                          />
                        )}
                        {msg.message_type === 'video' && (
                          <video controls className="max-w-full rounded-lg">
                            <source
                              src={`http://localhost:8002${msg.media_file}`}
                              type={msg.media_file?.endsWith('.mp4') ? 'video/mp4' : 'video/quicktime'}
                            />
                          </video>
                        )}
                        <p className="text-xs text-gray-300 mt-1 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex items-center gap-2 bg-gray-800 rounded-full p-2 border border-gray-700">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow py-2 px-4 bg-transparent focus:outline-none text-white placeholder-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
                <input
                  type="file"
                  accept="image/*,video/mp4,video/quicktime"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="p-2 hover:bg-gray-700 rounded-full cursor-pointer transition-all duration-300"
                >
                  <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.586 10.758a6 6 0 108.486 8.486L20.758 12"
                    />
                  </svg>
                </label>
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold"
                  disabled={isSending}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-400 text-xl font-medium">Select a friend to start chatting</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Chat;