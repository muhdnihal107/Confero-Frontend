import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchChatGroups, fetchMessages, createChatGroup, sendMessage } from '../../api/chat';
import { fetchFriends } from '../../api/auth';
import { useAuthStore } from '../../Store/authStore';
import { useChatStore } from '../../Store/ChatStore';
import { ChatGroup, Message } from '../../api/chat';
import { ProfileResponse } from '../../api/auth';
import Header from '../../components/Header';
import CreateGroupModal from './CreateGroupModal'; // Fixed import path
import GroupDetailsModal from './GroupDetailsModal'; // Fixed import path

const Chat: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const { currentGroup, messages, setCurrentGroup, addMessage, connectWebSocket, disconnectWebSocket } = useChatStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<ProfileResponse[]>({
    queryKey: ['friends'],
    queryFn: fetchFriends,
    enabled: !!accessToken,
  });

  // Fetch chat groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<ChatGroup[]>({
    queryKey: ['chatGroups'],
    queryFn: () => fetchChatGroups(accessToken!),
    enabled: !!accessToken,
  });

  // Split groups into group chats and 1:1 chats
  const groupChats = groups.filter((group) => group.is_group_chat);
  const oneOnOneChats = groups.filter((group) => !group.is_group_chat);

  // Restore currentGroup from localStorage
  useEffect(() => {
    if (!accessToken || !user || !groups.length || currentGroup) return;
    const savedGroupId = localStorage.getItem('currentGroupId');
    if (savedGroupId) {
      const savedGroup = groups.find((group) => group.id === savedGroupId);
      if (savedGroup) setCurrentGroup(savedGroup);
    }
  }, [accessToken, user, groups, currentGroup, setCurrentGroup]);

  // Save currentGroup to localStorage
  useEffect(() => {
    if (currentGroup) localStorage.setItem('currentGroupId', currentGroup.id);
  }, [currentGroup]);

  // Fetch messages for current group
  const { data: fetchedMessages = [], isLoading: messagesLoading, error, isError } = useQuery<Message[]>({
    queryKey: ['messages', currentGroup?.id],
    queryFn: () => fetchMessages(currentGroup!.id, accessToken!),
    enabled: !!accessToken && !!currentGroup,
    refetchOnMount: 'always',
  });

  // Log errors
  useEffect(() => {
    if (isError && error) console.error('Message fetch error:', error);
  }, [isError, error]);

  // Add fetched messages to store
  useEffect(() => {
    fetchedMessages.forEach((msg: Message) => {
      if (!useChatStore.getState().messages.some((existing) => existing.id === msg.id)) {
        useChatStore.getState().addMessage(msg);
      }
    });
  }, [fetchedMessages]);

  // Invalidate messages on new WebSocket message
  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      if (state.messages.length > prevState.messages.length && currentGroup) {
        queryClient.invalidateQueries({ queryKey: ['messages', currentGroup.id] });
      }
    });
    return () => unsubscribe();
  }, [currentGroup, queryClient]);

  // Redirect to login if no access token
  useEffect(() => {
    if (!accessToken) navigate('/login');
  }, [accessToken, navigate]);

  // Connect WebSocket
  useEffect(() => {
    if (currentGroup && accessToken) {
      connectWebSocket(currentGroup.id, accessToken);
      return () => disconnectWebSocket();
    }
  }, [currentGroup, accessToken, connectWebSocket, disconnectWebSocket]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectFriend = async (friend: ProfileResponse) => {
    if (!accessToken || !user) return;
    useChatStore.getState().setMessages([]);
    const existingGroup = oneOnOneChats.find(
      (group) =>
        !group.is_group_chat &&
        group.participants.length === 2 &&
        group.participants.includes(user.email) &&
        group.participants.includes(friend.email)
    );
    if (existingGroup) {
      setCurrentGroup(existingGroup);
      queryClient.invalidateQueries({ queryKey: ['messages', existingGroup.id] });
    } else {
      try {
        const newGroup = await createChatGroup(
          { is_group_chat: false, participants: [user.email, friend.email] },
          accessToken
        );
        setCurrentGroup(newGroup);
        queryClient.invalidateQueries({ queryKey: ['messages', newGroup.id] });
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    }
  };

  const handleSelectGroup = (group: ChatGroup) => {
    useChatStore.getState().setMessages([]);
    setCurrentGroup(group);
    queryClient.invalidateQueries({ queryKey: ['messages', group.id] });
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

  const getDisplayName = (email: string): string => email.split('@')[0];

  const getFriendDetails = (): ProfileResponse | null => {
    if (!currentGroup || !user || currentGroup.is_group_chat) return null;
    const friendEmail = currentGroup.participants.find((email) => email !== user.email);
    return friends.find((friend) => friend.email === friendEmail) || null;
  };

  const getGroupDisplayName = (group: ChatGroup): string => {
    if (group.name) return group.name;
    if (!group.is_group_chat) {
      const friendEmail = group.participants.find((email) => email !== user?.email);
      const friend = friends.find((f) => f.email === friendEmail);
      return friend?.username || getDisplayName(friendEmail || '');
    }
    return 'Unnamed Group';
  };

  if (friendsLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-blue-900">
        <div className="text-white text-3xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030103a8] text-white flex flex-col overflow-hidden">
  <Header />
  <main className="flex-grow max-w-7xl mt-12 mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-6">
    {/* Sidebar */}
    <aside className="w-full lg:w-80 bg-[#00000066] backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-700/50">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Chats
        </h2>
        <button
          onClick={() => setShowGroupModal(true)}
          className="px-4 py-2 bg-[#205b11] rounded-lg text-sm font-semibold text-[#e5e4e4] hover:bg-[#0d3802] focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
        >
          Create Group
        </button>
      </div>
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-800/40">
        {/* Group Chats Section */}
        {groupChats.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">Group Chats</h3>
            {groupChats.map((group) => (
              <button
                key={group.id}
                onClick={() => handleSelectGroup(group)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                  currentGroup?.id === group.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md'
                    : 'bg-gray-700/40 hover:bg-gray-700/60'
                } transform hover:scale-[1.02] active:scale-[0.98]`}
                aria-label={`Chat with ${getGroupDisplayName(group)}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-3 ring-1 ring-gray-600/50">
                  <span className="text-lg font-bold text-white">
                    {getGroupDisplayName(group).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-base font-semibold text-gray-100">{getGroupDisplayName(group)}</p>
                  <p className="text-xs text-gray-400 truncate">{`${group.participants.length} members`}</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </button>
            ))}
          </>
        )}
        {/* 1:1 Chats Section */}
        {oneOnOneChats.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">1:1 Chats</h3>
            {oneOnOneChats.map((group) => (
              <button
                key={group.id}
                onClick={() => handleSelectGroup(group)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                  currentGroup?.id === group.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md'
                    : 'bg-gray-700/40 hover:bg-gray-700/60'
                } transform hover:scale-[1.02] active:scale-[0.98]`}
                aria-label={`Chat with ${getGroupDisplayName(group)}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-3 ring-1 ring-gray-600/50">
                  <span className="text-lg font-bold text-white">
                    {getGroupDisplayName(group).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-base font-semibold text-gray-100">{getGroupDisplayName(group)}</p>
                  <p className="text-xs text-gray-400 truncate">1:1 Chat</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </button>
            ))}
          </>
        )}
        {/* Friends Section */}
        {friends.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">Friends</h3>
            {friends.map((friend) => (
              <button
                key={friend.user_id}
                onClick={() => handleSelectFriend(friend)}
                className="w-full flex items-center p-3 rounded-xl transition-all duration-300 bg-gray-700/40 hover:bg-gray-700/60 transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label={`Chat with ${friend.username || getDisplayName(friend.email)}`}
              >
                {friend.profile_photo ? (
                  <img
                    src={`http://localhost:8000${friend.profile_photo}`}
                    alt={friend.username || friend.email}
                    className="w-12 h-12 rounded-full object-cover mr-3 ring-1 ring-indigo-400/30"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-3 ring-1 ring-gray-600/50">
                    <span className="text-lg font-bold text-white">
                      {(friend.username || friend.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-left flex-1">
                  <p className="text-base font-semibold text-gray-100">
                    {friend.username || getDisplayName(friend.email)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </button>
            ))}
          </>
        )}
        {groupChats.length === 0 && oneOnOneChats.length === 0 && friends.length === 0 && (
          <p className="text-gray-400 text-center text-sm font-medium">No chats or friends yet.</p>
        )}
      </div>
    </aside>

    {/* Chat Section */}
    <section className="flex-grow bg-[#00000066] backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-700/50 flex flex-col">
      {currentGroup ? (
        <>
          {/* Chat Header */}
          <div className="flex items-center justify-between mb-6 border-b border-gray-700/50 pb-4">
            <div className="flex items-center">
              {currentGroup.is_group_chat ? (
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-4 ring-1 ring-gray-600/50">
                  <span className="text-xl font-bold text-white">
                    {getGroupDisplayName(currentGroup).charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : getFriendDetails()?.profile_photo ? (
                <img
                  src={`http://localhost:8000${getFriendDetails()?.profile_photo}`}
                  alt={getFriendDetails()?.username || getFriendDetails()?.email}
                  className="w-14 h-14 rounded-full object-cover mr-4 ring-1 ring-indigo-400/30"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-4 ring-1 ring-gray-600/50">
                  <span className="text-xl font-bold text-white">
                    {(getFriendDetails()?.username || getFriendDetails()?.email || '').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {getGroupDisplayName(currentGroup)}
                </h2>
                {currentGroup.is_group_chat && (
                  <p className="text-xs text-gray-400">{`${currentGroup.participants.length} members`}</p>
                )}
              </div>
            </div>
            {currentGroup.is_group_chat && (
              <button
                onClick={() => setShowGroupDetails(true)}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
              >
                Group Details
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto mb-6 max-h-[calc(100vh-350px)] bg-gray-900/20 rounded-xl p-4 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-800/40">
            {messagesLoading ? (
              <p className="text-gray-400 text-center text-sm animate-pulse">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm font-medium">Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${
                    msg.sender_email === user?.email ? 'justify-end' : 'justify-start'
                  } animate-slide-in`}
                >
                  <div
                    className={`max-w-xs sm:max-w-md p-4 rounded-xl shadow-md transition-all duration-300 ${
                      msg.sender_email === user?.email
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-gray-700/50 text-gray-200'
                    } hover:shadow-lg relative group`}
                  >
                    {currentGroup.is_group_chat && msg.sender_email !== user?.email && (
                      <p className="text-xs font-semibold text-gray-300 mb-1">
                        {getDisplayName(msg.sender_email)}
                      </p>
                    )}
                    {msg.message_type === 'text' && <p className="text-sm leading-relaxed">{msg.content}</p>}
                    {msg.message_type === 'image' && (
                      <img
                        src={`http://localhost:8002${msg.media_file}`}
                        alt="Chat image"
                        className="w-64 h-auto rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {msg.message_type === 'video' && (
                      <video controls className="max-w-full rounded-lg shadow-sm">
                        <source
                          src={`http://localhost:8002${msg.media_file}`}
                          type={msg.media_file?.endsWith('.mp4') ? 'video/mp4' : 'video/quicktime'}
                        />
                      </video>
                    )}
                    <p className="text-xs text-gray-400/80 mt-2 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="sticky bottom-0 flex items-center gap-3 bg-gray-900/30 backdrop-blur-xl rounded-full p-3 border border-gray-700/50 shadow-md">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow py-2 px-4 bg-gray-800/50 text-gray-200 placeholder-gray-500 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all duration-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
              aria-label="Message input"
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
              className="p-2 bg-gray-700/50 rounded-full hover:bg-gray-600/70 cursor-pointer transition-all duration-300"
              aria-label="Upload file"
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
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-6 rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 text-sm font-semibold shadow-sm disabled:opacity-50 transform hover:scale-105 active:scale-95"
              disabled={isSending}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400 text-lg font-medium animate-pulse">Select a chat to start messaging</p>
        </div>
      )}
    </section>
  </main>
  {showGroupModal && (
    <CreateGroupModal
      friends={friends}
      onClose={() => setShowGroupModal(false)}
      onGroupCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['chatGroups'] });
      }}
    />
  )}
  {showGroupDetails && currentGroup && (
    <GroupDetailsModal
      group={currentGroup}
      friends={friends}
      onClose={() => setShowGroupDetails(false)}
      onGroupUpdated={() => {
        queryClient.invalidateQueries({ queryKey: ['chatGroups'] });
      }}
    />
  )}
</div>
  );
};

export default Chat;