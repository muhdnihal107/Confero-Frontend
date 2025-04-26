import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SimplePeer, { Instance as SimplePeerInstance, SignalData } from 'simple-peer';
import { fetchRoomDetails, Room, WebRTCSignal, connectToRoomWebSocket, closeWebSocket } from '../../api/room';
import { useAuthStore } from '../../Store/authStore';

// Interfaces
interface PeerConnection {
  peer: SimplePeerInstance;
  userEmail: string;
  stream?: MediaStream;
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
}

const VideoCall: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, SimplePeerInstance>>(new Map());
  const isMountedRef = useRef(true);

  // Fetch room details
  const { data: room, isLoading, error } = useQuery<Room, Error>({
    queryKey: ['room', room_id],
    queryFn: () => fetchRoomDetails(room_id!),
    enabled: !!room_id,
  });

  // Initialize media stream
  useEffect(() => {
    isMountedRef.current = true;
    const startMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (isMountedRef.current) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        if (isMountedRef.current) {
          setConnectionError('Failed to access camera or microphone');
        }
      }
    };
    startMedia();

    return () => {
      isMountedRef.current = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Initialize WebSocket and WebRTC
  useEffect(() => {
    if (!room_id || !userEmail || !stream) return;

    isMountedRef.current = true;
    setConnectionError(null);

    const ws = connectToRoomWebSocket(Number(room_id), {
      onMessage: (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[${userEmail}] Received WebSocket message:`, data);

          if (data.event === 'user-connected' && data.userEmail !== userEmail) {
            console.log(`[${userEmail}] User connected: ${data.userEmail}`);
            if (!peersRef.current.has(data.userEmail)) {
              createPeer(data.userEmail, ws, stream);
            } else {
              console.warn(`[${userEmail}] Peer for ${data.userEmail} already exists`);
            }
          } else if (data.event === 'user-disconnected') {
            console.log(`[${userEmail}] User disconnected: ${data.userEmail}`);
            setPeers((prev) => prev.filter((p) => p.userEmail !== data.userEmail));
            const peer = peersRef.current.get(data.userEmail);
            if (peer) {
              peer.destroy();
              peersRef.current.delete(data.userEmail);
            }
          } else if (data.sender && data.sender !== userEmail) {
            const signalData = data as WebRTCSignal;
            console.log(`[${userEmail}] WebRTC signal from ${signalData.sender}: ${signalData.type}`);
            if (signalData.type === 'chat_message') {
              if (isMountedRef.current) {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    sender: signalData.sender,
                    content: signalData.data as string,
                    timestamp: signalData.timestamp || new Date().toISOString(),
                  },
                ]);
              }
            } else {
              let peer = peersRef.current.get(signalData.sender);
              if (!peer) {
                console.log(`[${userEmail}] Creating new peer for ${signalData.sender}`);
                peer = addPeer(signalData.sender, ws, stream);
              }
              try {
                if (signalData.type === 'webrtc_offer' || signalData.type === 'webrtc_answer') {
                  peer.signal(signalData.data as RTCSessionDescriptionInit);
                } else if (signalData.type === 'ice_candidate') {
                  peer.signal({ candidate: signalData.data as RTCIceCandidateInit });
                }
              } catch (err) {
                console.error(`[${userEmail}] Error signaling peer ${signalData.sender}:`, err);
              }
            }
          }
        } catch (err) {
          console.error(`[${userEmail}] Error processing WebSocket message:`, err);
        }
      },
      onOpen: () => {
        console.log(`[${userEmail}] WebSocket connected`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'join-room', roomId: room_id, userEmail }));
        } else {
          console.warn(`[${userEmail}] WebSocket not open when trying to send join-room`);
        }
      },
      onError: (error) => {
        console.error(`[${userEmail}] WebSocket error:`, error);
        if (isMountedRef.current) {
          setConnectionError('WebSocket connection failed');
        }
      },
      onClose: (event) => {
        console.log(`[${userEmail}] WebSocket closed: ${event.code} ${event.reason}`);
        if (isMountedRef.current && event.code !== 1000) {
          setConnectionError(`WebSocket disconnected (code: ${event.code})`);
        }
      },
    });

    wsRef.current = ws;

    return () => {
      isMountedRef.current = false;
      closeWebSocket(ws);
      peersRef.current.forEach((peer) => peer.destroy());
      peersRef.current.clear();
    };
  }, [room_id, userEmail, stream]);

  // Create a new peer connection (initiator)
  const createPeer = (targetEmail: string, ws: WebSocket, stream: MediaStream) => {
    console.log(`[${userEmail}] Creating peer for ${targetEmail} (initiator)`);
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data: SignalData) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`[${userEmail}] Sending signal to ${targetEmail}: ${data.type}`);
        ws.send(
          JSON.stringify({
            type: data.type === 'offer' ? 'webrtc_offer' : 'webrtc_answer',
            data,
            target: targetEmail,
            sender: userEmail,
          } as WebRTCSignal)
        );
      } else {
        console.warn(`[${userEmail}] Cannot send signal to ${targetEmail}: WebSocket not open`);
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (isMountedRef.current) {
        console.log(`[${userEmail}] Received stream from ${targetEmail}`);
        setPeers((prev) => {
          const existing = prev.find((p) => p.userEmail === targetEmail);
          if (existing && existing.stream) {
            console.warn(`[${userEmail}] Stream already exists for ${targetEmail}`);
            return prev;
          }
          return [
            ...prev.filter((p) => p.userEmail !== targetEmail),
            { peer, userEmail: targetEmail, stream: remoteStream },
          ];
        });
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`[${userEmail}] Peer error with ${targetEmail}:`, err);
    });

    peer.on('close', () => {
      console.log(`[${userEmail}] Peer connection closed for ${targetEmail}`);
      peersRef.current.delete(targetEmail);
      setPeers((prev) => prev.filter((p) => p.userEmail !== targetEmail));
    });

    peersRef.current.set(targetEmail, peer);
  };

  // Add a peer for incoming connection (non-initiator)
  const addPeer = (senderEmail: string, ws: WebSocket, stream: MediaStream) => {
    console.log(`[${userEmail}] Adding peer for ${senderEmail} (non-initiator)`);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data: SignalData) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`[${userEmail}] Sending signal to ${senderEmail}: ${data.type}`);
        ws.send(
          JSON.stringify({
            type: data.type === 'offer' ? 'webrtc_offer' : 'webrtc_answer',
            data,
            target: senderEmail,
            sender: userEmail,
          } as WebRTCSignal)
        );
      } else {
        console.warn(`[${userEmail}] Cannot send signal to ${senderEmail}: WebSocket not open`);
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (isMountedRef.current) {
        console.log(`[${userEmail}] Received stream from ${senderEmail}`);
        setPeers((prev) => {
          const existing = prev.find((p) => p.userEmail === senderEmail);
          if (existing && existing.stream) {
            console.warn(`[${userEmail}] Stream already exists for ${senderEmail}`);
            return prev;
          }
          return [
            ...prev.filter((p) => p.userEmail !== senderEmail),
            { peer, userEmail: senderEmail, stream: remoteStream },
          ];
        });
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`[${userEmail}] Peer error with ${senderEmail}:`, err);
    });

    peer.on('close', () => {
      console.log(`[${userEmail}] Peer connection closed for ${senderEmail}`);
      peersRef.current.delete(senderEmail);
      setPeers((prev) => prev.filter((p) => p.userEmail !== senderEmail));
    });

    peersRef.current.set(senderEmail, peer);
    return peer;
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(!videoTrack.enabled);
      }
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (chatInput.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat_message',
        data: chatInput,
        sender: userEmail,
        timestamp: new Date().toISOString(),
      } as WebRTCSignal;
      wsRef.current.send(JSON.stringify(message));
      setChatMessages((prev) => [
        ...prev,
        { sender: userEmail, content: chatInput, timestamp: message.timestamp },
      ]);
      setChatInput('');
    }
  };

  // Handle chat input key press (Enter to send)
  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      sendChatMessage();
    }
  };

  // End call
  const endCall = () => {
    if (wsRef.current) {
      closeWebSocket(wsRef.current);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();
    setPeers([]);
    setStream(null);
    navigate('/room'); // Redirect to rooms list or desired route
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-2xl text-gray-300 animate-pulse">Loading room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-2xl text-red-400">Error loading room: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 bg-gray-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            {room.name} - Video Call
          </h1>
          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full font-semibold text-white transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Call
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto p-4 gap-4">
        {/* Video Section */}
        <div className="flex-1 flex flex-col gap-4">
          {connectionError && (
            <div className="p-4 bg-red-900/50 rounded-lg text-red-300 text-center">
              {connectionError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-800/80 rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg aspect-video object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-gray-900/70 px-2 py-1 rounded-md">
                <span className="text-sm font-medium">{userEmail} (You)</span>
              </div>
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-full text-white transition-all duration-300 ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 9l-6 6m0-6l6 6" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-full text-white transition-all duration-300 ${
                    !isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  title={isVideoOn ? 'Video Off' : 'Video On'}
                >
                  {isVideoOn ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12m-3-10H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remote Videos */}
            {peers.map((peer) => (
              <div
                key={peer.userEmail}
                className="relative bg-gray-800/80 rounded-xl p-3 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <video
                  autoPlay
                  ref={(el) => {
                    if (el && peer.stream) {
                      console.log(`[${userEmail}] Assigning stream for ${peer.userEmail}`);
                      el.srcObject = peer.stream;
                    }
                  }}
                  className="w-full rounded-lg aspect-video object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-gray-900/70 px-2 py-1 rounded-md">
                  <span className="text-sm font-medium">{peer.userEmail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat and Participants Panel */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* Chat Panel */}
          <div className="bg-gray-800/80 rounded-xl shadow-lg p-4 flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-indigo-300 mb-3">Chat</h2>
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 bg-gray-900/50 rounded-lg max-h-[400px]"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 p-2 rounded-lg ${
                    msg.sender === userEmail
                      ? 'bg-indigo-600/50 text-right ml-auto'
                      : 'bg-gray-700/50 text-left mr-auto'
                  } max-w-[80%] animate-fade-in`}
                >
                  <p className="text-sm font-medium">{msg.sender}</p>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendChatMessage}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-all duration-300"
              >
                Send
              </button>
            </div>
          </div>

          {/* Participants Panel */}
          <div className="bg-gray-800/80 rounded-xl shadow-lg p-4">
            <h2 className="text-lg font-semibold text-indigo-300 mb-3">Participants</h2>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {room.participants.map((participant) => (
                <li
                  key={participant}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-all duration-200 text-sm"
                >
                  {participant}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoCall;