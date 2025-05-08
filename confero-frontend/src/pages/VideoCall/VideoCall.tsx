import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SimplePeer, { Instance as SimplePeerInstance, SignalData } from 'simple-peer';
import { fetchRoomDetails, Room, connectToRoomWebSocket, closeWebSocket } from '../../api/room';
import { useAuthStore } from '../../Store/authStore';

// Interfaces
interface PeerConnection {
  peer: SimplePeerInstance;
  userEmail: string;
  stream?: MediaStream;
  isScreenShare?: boolean;
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
}

interface ScreenShareState {
  sender: string;
  isSharing: boolean;
}

interface WebRTCSignal {
  type: 'webrtc_offer' | 'webrtc_answer' | 'ice_candidate' | 'chat_message' | 'screen_share_state';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | string | { isSharing: boolean };
  sender: string;
  target?: string;
  timestamp?: string;
}

interface EnlargedVideo {
  userEmail: string;
  isScreenShare: boolean;
}

interface Notification {
  id: number;
  message: string;
  type: 'connected' | 'disconnected';
}


const style = `
  @keyframes slide-in-out {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    10% {
      transform: translateY(0);
      opacity: 1;
    }
    90% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
  .animate-slide-in-out {
    animation: slide-in-out 3s ease-in-out forwards;
  }
`;

const VideoCall: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [screenShareStates, setScreenShareStates] = useState<Map<string, boolean>>(new Map());
  const [enlargedVideo, setEnlargedVideo] = useState<EnlargedVideo | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, SimplePeerInstance>>(new Map());
  const isMountedRef = useRef(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch room details
  const { data: room, isLoading, error } = useQuery<Room, Error>({
    queryKey: ['room', room_id],
    queryFn: () => fetchRoomDetails(room_id!),
    enabled: !!room_id,
  });

  const addNotification = (message: string, type: 'connected' | 'disconnected') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }

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

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);


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
            addNotification(`${data.userEmail.split('@')[0]} joined the call`, 'connected');
            if (!peersRef.current.has(data.userEmail)) {
              createPeer(data.userEmail, ws, stream);
            } else {
              console.warn(`[${userEmail}] Peer for ${data.userEmail} already exists`);
            }
          } else if (data.event === 'user-disconnected') {
            console.log(`[${userEmail}] User disconnected: ${data.userEmail}`);
            setPeers((prev) => prev.filter((p) => p.userEmail !== data.userEmail));
            setScreenShareStates((prev) => {
              const newMap = new Map(prev);
              newMap.delete(data.userEmail);
              return newMap;
            });
            const peer = peersRef.current.get(data.userEmail);
            if (peer) {
              peer.destroy();
              peersRef.current.delete(data.userEmail);
            }
          } else if (data.sender && data.sender !== userEmail) {
            const signalData = data as WebRTCSignal;
            console.log(`[${userEmail}] WebRTC signal from ${signalData.sender}: ${signalData.type}`);
            if (signalData.type === 'chat_message') {
              if (isMountedRef.current && typeof signalData.data === 'string') {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    sender: signalData.sender,
                    content: signalData.data as string,
                    timestamp: signalData.timestamp || new Date().toISOString(),
                  },
                ]);
              }
            } else if (signalData.type === 'screen_share_state') {
              if (
                isMountedRef.current &&
                typeof signalData.data === 'object' &&
                'isSharing' in signalData.data
              ) {
                setScreenShareStates((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(signalData.sender, signalData.data.isSharing);
                  return newMap;
                });
              }
            } else {
              let peer = peersRef.current.get(signalData.sender);
              if (!peer) {
                console.log(`[${userEmail}] Creating new peer for ${signalData.sender}`);
                peer = addPeer(signalData.sender, ws, stream);
              }
              try {
                if (
                  signalData.type === 'webrtc_offer' ||
                  signalData.type === 'webrtc_answer'
                ) {
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


  ;


  // Handle video click to enlarge or minimize
  const handleVideoClick = (userEmail: string, isScreenShare: boolean) => {
    if (
      enlargedVideo &&
      enlargedVideo.userEmail === userEmail &&
      enlargedVideo.isScreenShare === isScreenShare
    ) {
      setEnlargedVideo(null); // Minimize if clicking the same video
    } else {
      setEnlargedVideo({ userEmail, isScreenShare }); // Enlarge the clicked video
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      // Notify others
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'screen_share_state',
            data: { isSharing: false },
            sender: userEmail,
          } as WebRTCSignal)
        );
      }
      // Restore camera stream in peer connections
      if (stream) {
        peersRef.current.forEach((peer, targetEmail) => {
          const senders = (peer as any)._pc.getSenders() as RTCRtpSender[];
          const videoSender = senders.find((sender) => sender.track?.kind === 'video');
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]).catch((err) => {
              console.error(`[${userEmail}] Error restoring camera track for ${targetEmail}:`, err);
            });
            console.log(`[${userEmail}] Restored camera track for ${targetEmail}`);
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      // Clear enlarged video if it was the screen share
      if (enlargedVideo?.isScreenShare && enlargedVideo.userEmail === userEmail) {
        setEnlargedVideo(null);
      }
    } else {
      // Start screen sharing
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(screen);
        setIsScreenSharing(true);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screen;
        }
        // Notify others
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'screen_share_state',
              data: { isSharing: true },
              sender: userEmail,
            } as WebRTCSignal)
          );
        }
        // Replace video track in peer connections
        peersRef.current.forEach((peer, targetEmail) => {
          const senders = (peer as any)._pc.getSenders() as RTCRtpSender[];
          const videoSender = senders.find((sender) => sender.track?.kind === 'video');
          if (videoSender && screen.getVideoTracks()[0]) {
            videoSender.replaceTrack(screen.getVideoTracks()[0]).catch((err) => {
              console.error(`[${userEmail}] Error replacing with screen track for ${targetEmail}:`, err);
            });
            console.log(`[${userEmail}] Replaced with screen track for ${targetEmail}`);
          }
        });
        // Stop screen share when user clicks "Stop sharing"
        screen.getVideoTracks()[0].onended = () => {
          if (isMountedRef.current) {
            toggleScreenShare();
          }
        };
      } catch (err) {
        console.error('Error starting screen share:', err);
        setConnectionError('Failed to start screen sharing');
      }
    }
  };

  // Create a new peer connection (initiator)
  const createPeer = (targetEmail: string, ws: WebSocket, stream: MediaStream) => {
    console.log(`[${userEmail}] Creating peer for ${targetEmail} (initiator)`);
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
            {
              peer,
              userEmail: targetEmail,
              stream: remoteStream,
              isScreenShare: remoteStream.getVideoTracks()[0]?.label.includes('screen'),
            },
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
      if (enlargedVideo?.userEmail === targetEmail) {
        setEnlargedVideo(null);
      }
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
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
            {
              peer,
              userEmail: senderEmail,
              stream: remoteStream,
              isScreenShare: remoteStream.getVideoTracks()[0]?.label.includes('screen'),
            },
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
      if (enlargedVideo?.userEmail === senderEmail) {
        setEnlargedVideo(null);
      }
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
      const message: WebRTCSignal = {
        type: 'chat_message',
        data: chatInput,
        sender: userEmail,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
      setChatMessages((prev) => [
        ...prev,
        {
          sender: userEmail,
          content: chatInput,
          timestamp: message.timestamp!,
        },
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
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();
    setPeers([]);
    setStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    setEnlargedVideo(null);
    navigate('/room');
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
    <div className="min-h-screen bg-[#2f3136] text-white flex flex-col">
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
    {notifications.map((notification) => (
      <div
        key={notification.id}
        className={`mb-2 p-3 rounded-lg shadow-md text-white text-sm font-medium animate-slide-in-out flex items-center gap-2 transition-all duration-300 ${
          notification.type === 'connected'
            ? 'bg-[#43b581]/80 backdrop-blur-sm'
            : 'bg-[#f04747]/80 backdrop-blur-sm'
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {notification.type === 'connected' ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          )}
        </svg>
        <span>{notification.message}</span>
      </div>
    ))}
  </div>
  {/* Header */}
  <header className="p-4 bg-[#36393f]/90 shadow-md">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#7289da] to-[#d83c3c] bg-clip-text text-transparent">
        {room.name} - Voice & Video
      </h1>
      <button
        onClick={endCall}
        className="px-4 py-2 bg-[#f04747] hover:bg-[#d83c3c] rounded-md font-semibold text-white transition-all duration-200 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        End Call
      </button>
    </div>
  </header>

  {/* Main Content */}
  <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto p-4 gap-6">
    {/* Video Section */}
    <div className="flex-1 flex flex-col gap-6">
      {connectionError && (
        <div className="p-4 bg-[#f04747]/20 rounded-lg text-[#faa61a] text-center">
          {connectionError}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Small Videos Column (when a video is enlarged) */}
        {enlargedVideo && (
          <div className="flex flex-col gap-1 w-full sm:w-36 md:w-44">
            {/* Local Camera Video */}
            <div className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
              <video
                ref={(el) => {
                  if (el && stream) {
                    console.log(`[${userEmail}] Assigning local camera stream in small column`);
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                muted
                className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
              />
              <div className="absolute bottom-2 left-2 bg-[#2f3136]/60 backdrop-blur-sm px-1 py-0.5 rounded">
                <span className="text-xs font-medium">{userEmail} (You)</span>
              </div>
              <button
                onClick={() => handleVideoClick(userEmail, false)}
                className="absolute bottom-2 right-2 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                title="Enlarge"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                  />
                </svg>
              </button>
            </div>

            {/* Local Screen Share (if active) */}
            {isScreenSharing && (
              <div className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                <video
                  ref={(el) => {
                    if (el && screenStream) {
                      console.log(`[${userEmail}] Assigning local screen stream in small column`);
                      el.srcObject = screenStream;
                    }
                  }}
                  autoPlay
                  muted
                  className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
                />
                <div className="absolute bottom-2 left-2 bg-[#2f3136]/60 backdrop-blur-sm px-1 py-0.5 rounded">
                  <span className="text-xs font-medium">{userEmail} (Screen)</span>
                </div>
                <button
                  onClick={() => handleVideoClick(userEmail, true)}
                  className="absolute bottom-2 right-2 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                  title="Enlarge"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Remote Videos */}
            {peers.map((peer) => (
              <div
                key={peer.userEmail + (peer.isScreenShare ? '-screen' : '')}
                className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-2 shadow-sm"
              >
                <video
                  autoPlay
                  ref={(el) => {
                    if (el && peer.stream) {
                      console.log(`[${userEmail}] Assigning stream for ${peer.userEmail}`);
                      el.srcObject = peer.stream;
                    }
                  }}
                  className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
                />
                <div className="absolute bottom-2 left-2 bg-[#2f3136]/60 backdrop-blur-sm px-1 py-0.5 rounded">
                  <span className="text-xs font-medium">
                    {peer.userEmail} {peer.isScreenShare ? '(Screen)' : ''}
                  </span>
                </div>
                <button
                  onClick={() => handleVideoClick(peer.userEmail, peer.isScreenShare || false)}
                  className="absolute bottom-2 right-2 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                  title="Enlarge"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Video Area */}
        <div className="flex-1">
          {enlargedVideo ? (
            // Enlarged Video
            <div className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-3 shadow-md">
              {enlargedVideo.userEmail === userEmail && !enlargedVideo.isScreenShare ? (
                <>
                  <video
                    ref={(el) => {
                      if (el && stream) {
                        console.log(`[${userEmail}] Assigning local camera stream in enlarged mode`);
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    muted
                    className="w-full max-h-[80vh] rounded-md object-contain bg-[#2f3136]"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <button
                      onClick={toggleAudio}
                      className={`p-2 rounded-md text-white transition-all duration-200 ${
                        isMuted ? 'bg-[#f04747] hover:bg-[#d83c3c]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 9l-6 6m0-6l6 6"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`p-2 rounded-md text-white transition-all duration-200 ${
                        !isVideoOn ? 'bg-[#f04747] hover:bg-[#d83c3c]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                      }`}
                      title={isVideoOn ? 'Video Off' : 'Video On'}
                    >
                      {isVideoOn ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12m-3-10H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={toggleScreenShare}
                      className={`p-2 rounded-md text-white transition-all duration-200 ${
                        isScreenSharing ? 'bg-[#43b581] hover:bg-[#3ca374]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                      }`}
                      title={isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                    >
                      {isScreenSharing ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 17V7m0 10h6m-6-10h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                    <span className="text-sm font-medium">{userEmail} (You)</span>
                  </div>
                  <button
                    onClick={() => handleVideoClick(userEmail, false)}
                    className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                    title="Minimize"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 12H4m8 8l-8-8m8-8l-8 8m16 0l-8-8m8 8l-8 8"
                      />
                    </svg>
                  </button>
                </>
              ) : enlargedVideo.userEmail === userEmail && enlargedVideo.isScreenShare ? (
                <>
                  <video
                    ref={(el) => {
                      if (el && screenStream) {
                        console.log(`[${userEmail}] Assigning local screen stream in enlarged mode`);
                        el.srcObject = screenStream;
                      }
                    }}
                    autoPlay
                    muted
                    className="w-full max-h-[80vh] rounded-md object-contain bg-[#2f3136]"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                    <span className="text-sm font-medium">{userEmail} (Screen)</span>
                  </div>
                  <button
                    onClick={() => handleVideoClick(userEmail, true)}
                    className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                    title="Minimize"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 12H4m8 8l-8-8m8-8l-8 8m16 0l-8-8m8 8l-8 8"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  {peers
                    .filter(
                      (peer) =>
                        peer.userEmail === enlargedVideo.userEmail &&
                        (peer.isScreenShare || false) === enlargedVideo.isScreenShare
                    )
                    .map((peer) => (
                      <div key={peer.userEmail + (peer.isScreenShare ? '-screen' : '')}>
                        <video
                          autoPlay
                          ref={(el) => {
                            if (el && peer.stream) {
                              console.log(`[${userEmail}] Assigning stream for ${peer.userEmail}`);
                              el.srcObject = peer.stream;
                            }
                          }}
                          className="w-full max-h-[80vh] rounded-md object-contain bg-[#2f3136]"
                        />
                        <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                          <span className="text-sm font-medium">
                            {peer.userEmail} {peer.isScreenShare ? '(Screen)' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleVideoClick(peer.userEmail, peer.isScreenShare || false)
                          }
                          className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                          title="Minimize"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M20 12H4m8 8l-8-8m8-8l-8 8m16 0l-8-8m8 8l-8 8"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                </>
              )}
            </div>
          ) : (
            // Default Grid (no enlarged video)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Local Camera Video */}
              <div className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                <video
                  ref={(el) => {
                    if (el && stream) {
                      console.log(`[${userEmail}] Assigning local camera stream in grid`);
                      el.srcObject = stream;
                    }
                  }}
                  autoPlay
                  muted
                  className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <button
                    onClick={toggleAudio}
                    className={`p-2 rounded-md text-white transition-all duration-200 ${
                      isMuted ? 'bg-[#f04747] hover:bg-[#d83c3c]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 9l-6 6m0-6l6 6"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-2 rounded-md text-white transition-all duration-200 ${
                      !isVideoOn ? 'bg-[#f04747] hover:bg-[#d83c3c]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                    }`}
                    title={isVideoOn ? 'Video Off' : 'Video On'}
                  >
                    {isVideoOn ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12m-3-10H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-md text-white transition-all duration-200 ${
                      isScreenSharing ? 'bg-[#43b581] hover:bg-[#3ca374]' : 'bg-[#7289da] hover:bg-[#677bc4]'
                    }`}
                    title={isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                  >
                    {isScreenSharing ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 17V7m0 10h6m-6-10h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                  <span className="text-sm font-medium">{userEmail} (You)</span>
                </div>
                <button
                  onClick={() => handleVideoClick(userEmail, false)}
                  className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                  title="Enlarge"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                    />
                  </svg>
                </button>
              </div>

              {/* Local Screen Share (if active) */}
              {isScreenSharing && (
                <div className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <video
                    ref={(el) => {
                      if (el && screenStream) {
                        console.log(`[${userEmail}] Assigning local screen stream in grid`);
                        el.srcObject = screenStream;
                      }
                    }}
                    autoPlay
                    muted
                    className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                    <span className="text-sm font-medium">{userEmail} (Screen)</span>
                  </div>
                  <button
                    onClick={() => handleVideoClick(userEmail, true)}
                    className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                    title="Enlarge"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Remote Videos */}
              {peers.map((peer) => (
                <div
                  key={peer.userEmail + (peer.isScreenShare ? '-screen' : '')}
                  className="relative bg-[#36393f]/80 backdrop-blur-sm rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <video
                    autoPlay
                    ref={(el) => {
                      if (el && peer.stream) {
                        console.log(`[${userEmail}] Assigning stream for ${peer.userEmail}`);
                        el.srcObject = peer.stream;
                      }
                    }}
                    className="w-full rounded-md aspect-video object-contain bg-[#2f3136]"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#2f3136]/60 px-2 py-1 rounded">
                    <span className="text-sm font-medium">
                      {peer.userEmail} {peer.isScreenShare ? '(Screen)' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleVideoClick(peer.userEmail, peer.isScreenShare || false)}
                    className="absolute bottom-3 right-3 bg-[#2f3136]/60 p-1 rounded-md hover:bg-[#40444b]/80 transition-all"
                    title="Enlarge"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 0h-4"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Chat and Participants Panel */}
    <div className="w-full md:w-80 flex flex-col gap-6">
      {/* Chat Panel */}
      <div className="bg-[#36393f]/80 backdrop-blur-sm rounded-lg shadow-md p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold text-[#7289da] mb-3">Chat</h2>
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 bg-[#2f3136]/50 rounded-md max-h-[400px]"
        >
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-2 rounded-md ${
                msg.sender === userEmail
                  ? 'bg-[#7289da]/20 text-right ml-auto'
                  : 'bg-[#40444b]/20 text-left mr-auto'
              } max-w-[80%] animate-fade-in`}
            >
              <p className="text-sm font-medium">{msg.sender.split("@")[0]}</p>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-[#72767d]">
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
            placeholder="Message #channel"
            className="flex-1 p-2 rounded-md bg-[#40444b] text-white placeholder-[#72767d] focus:outline-none focus:ring-2 focus:ring-[#7289da]"
          />
          <button
            onClick={sendChatMessage}
            className="px-4 py-2 bg-[#7289da] hover:bg-[#677bc4] rounded-md font-semibold text-white transition-all duration-200"
          >
            Send
          </button>
        </div>
      </div>

      {/* Participants Panel */}
      <div className="bg-[#36393f]/80 backdrop-blur-sm rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-[#7289da] mb-3">Members</h2>
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {room.participants.map((participant) => (
            <li
              key={participant}
              className="p-2 rounded-md bg-[#2f3136]/50 hover:bg-[#40444b]/50 transition-all duration-200 text-sm flex items-center gap-2"
            >
              <span>{participant}</span>
              {screenShareStates.get(participant) && (
                <span className="text-xs text-[#43b581]">(Sharing Screen)</span>
              )}
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