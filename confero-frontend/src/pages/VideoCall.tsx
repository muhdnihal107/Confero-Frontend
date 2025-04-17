import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRoomDetails, Room, connectToRoomWebSocket, sendWebRTCSignal, closeWebSocket } from '../api/room';
import { useAuthStore } from '../Store/authStore';

interface ChatMessage {
  type: 'chat_message';
  message: string;
  sender: string;
}

interface WebRTCOffer {
  type: 'webrtc_offer';
  data: RTCSessionDescriptionInit;
  sender: string;
  target?: string;
}

interface WebRTCAnswer {
  type: 'webrtc_answer';
  data: RTCSessionDescriptionInit;
  sender: string;
  target?: string;
}

interface WebRTCIceCandidate {
  type: 'ice_candidate';
  data: RTCIceCandidateInit;
  sender: string;
  target?: string;
}

interface UserJoined {
  type: 'user_joined';
  user_email: string;
}

interface UserLeft {
  type: 'user_left';
  user_email: string;
}

type WebSocketMessage = ChatMessage | WebRTCOffer | WebRTCAnswer | WebRTCIceCandidate | UserJoined | UserLeft;

const VideoCall: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { user } = useAuthStore();
  const userEmail = user?.email || 'unknown';

  // Fetch room details
  useEffect(() => {
    const loadRoom = async () => {
      if (!room_id) {
        setError('Invalid room ID');
        return;
      }
      try {
        const roomData = await fetchRoomDetails(room_id);
        console.log(' 1 Room data loaded:', roomData);
        setRoom(roomData);
      } catch (error) {
        console.error(' 2 Failed to load room:', error);
        setError('Failed to load room details');
      }
    };
    loadRoom();
  }, [room_id]);

  // Setup local video stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log(' 3 Local stream initialized:', stream.getTracks());
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.error('Error playing local video:', e));
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Failed to access camera. Please check permissions.');
      }
    };
    startVideo();

    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Setup WebSocket and WebRTC
  useEffect(() => {
    if (!room_id || !videoStream || !room) return;

    const ws = connectToRoomWebSocket(parseInt(room_id), {
      onMessage: (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log(' 4 Received WebSocket message:', data);
          if ('sender' in data && data.sender === userEmail) return;
          if (data.type === 'user_joined' && data.user_email === userEmail) return;
          switch (data.type) {
            case 'chat_message':
              setChatMessages((prev) => [...prev, data]);
              break;
            case 'webrtc_offer':
              if (data.target === userEmail || !data.target) {
                console.log(` 5 Processing offer from ${data.sender}`);
                handleOffer(data);
              }else{
                console.warn(`Offer ignored: target=${data.target}, userEmail=${userEmail}`);
              }
              break;
            case 'webrtc_answer':
              if (data.target === userEmail) {
                handleAnswer(data);
              }
              break;
            case 'ice_candidate':
              if (data.target === userEmail) {
                handleIceCandidate(data);
              }
              break;
            case 'user_joined':
              console.log(`6 ${data.user_email} joined the room`);
              if (data.user_email !== userEmail && userEmail < data.user_email) {
                console.log(`Initiating call to ${data.user_email} (email order)`);
                initiateCall(data.user_email);
              }
              break;
            case 'user_left':
              console.log(`${data.user_email} left the room`);
              handleUserLeft(data.user_email);
              break;
            default:
              console.warn('Unknown message type:', data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      },
      onOpen: () => {
        console.log('7 WebSocket opened, checking participants');
        const participants = room.participants.filter(
          (email) => email !== userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );
        console.log(' 8 Participants:', participants);
        participants.forEach((targetEmail) => {
          if (userEmail < targetEmail && !peerConnections.current.has(targetEmail)) {
            console.log(`9 Initiating call to ${targetEmail} (email order)`);
            initiateCall(targetEmail);
          }
        });
      },
      onError: (error) => {
        console.error(' 10 WebSocket error:', error);
        setError('WebSocket connection failed');
      },
      onClose: (event) => {
        console.log(` 11 WebSocket closed: code=${event.code}, reason=${event.reason}`);
        if (event.code !== 1000) {
          setError('WebSocket disconnected unexpectedly');
        }
      },
    });

    wsRef.current = ws;

    return () => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log('Cleaning up WebSocket on unmount');
        closeWebSocket(wsRef.current);
      }
      peerConnections.current.forEach((pc, email) => {
        console.log(`12 Closing peer connection for ${email}`);
        pc.close();
      });
      peerConnections.current.clear();
      setRemoteStreams({});
      setConnectionStatus({});
    };
  }, [room_id,userEmail, room?.id, videoStream, userEmail]);

  const createPeerConnection = (targetEmail: string) => {
    console.log(`13 Creating peer connection for ${targetEmail}`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN server
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log(`14 Sending ICE candidate to ${targetEmail}:`, event.candidate);
        sendWebRTCSignal(wsRef.current, 'ice_candidate', event.candidate, targetEmail);
      }
    };

    pc.ontrack = (event) => {
      console.log(`15 Received remote track from ${targetEmail}:`, event.track, event.streams);
      if (event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetEmail]: event.streams[0],
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`18 Connection state for ${targetEmail}: ${pc.connectionState}`);
      setConnectionStatus((prev) => ({
        ...prev,
        [targetEmail]: pc.connectionState,
      }));
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        console.error(`19 Connection to ${targetEmail} failed`);
        handleUserLeft(targetEmail);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`20 ICE connection state for ${targetEmail}: ${pc.iceConnectionState}`);
    };

    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        console.log(`21 Adding track: ${track.kind} - ${track.id} - enabled: ${track.enabled}`);
        pc.addTrack(track, videoStream);
      });
    }

    peerConnections.current.set(targetEmail, pc);
    return pc;
  };

  const initiateCall = async (targetEmail: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log(`22 Skipping call to ${targetEmail}: WebSocket unavailable`);
      return;
    }
    if (peerConnections.current.has(targetEmail)) {
      console.log(`23 Skipping call to ${targetEmail}: Connection exists`);
      return;
    }

    console.log(`24 Initiating WebRTC call to ${targetEmail}`);
    const pc = createPeerConnection(targetEmail);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`25 Sending offer to ${targetEmail}:`, offer);
      sendWebRTCSignal(wsRef.current, 'webrtc_offer', offer, targetEmail);
    } catch (error) {
      console.error(`Failed to initiate call to ${targetEmail}:`, error);
      pc.close();
      peerConnections.current.delete(targetEmail);
    }
  };

  const handleOffer = async (data: WebRTCOffer) => {
    const sender = data.sender;
    console.log(`26 Handling offer from ${sender}`);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error(`Cannot handle offer from ${sender}: WebSocket not connected`);
      return;
    }

    let pc = peerConnections.current.get(sender);
    if (!pc || pc.signalingState === 'closed') {
      console.log(`27 Creating new peer connection for ${sender}`);
      pc = createPeerConnection(sender);
    }

    try {
      if (pc.signalingState !== 'stable') {
        console.warn(`Resetting signaling state for ${sender} from ${pc.signalingState}`);
        await pc.setLocalDescription({ type: 'rollback' });
      }
      await pc.setRemoteDescription(new RTCSessionDescription(data.data));
      console.log(`28 Set remote description for offer from ${sender}`);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`29 Created answer for ${sender}:`, answer);
      sendWebRTCSignal(wsRef.current, 'webrtc_answer', answer, sender);
    } catch (error) {
      console.error(`Error handling offer from ${sender}:`, error);
      if (pc) {
        pc.close();
        peerConnections.current.delete(sender);
      }
    }
  };

  const handleAnswer = async (data: WebRTCAnswer) => {
    const sender = data.sender;
    console.log(`30 Handling answer from ${sender}`);
    const pc = peerConnections.current.get(sender);
    if (!pc) {
      console.warn(`No peer connection for ${sender}`);
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.data));
      console.log(`31 Set remote description for answer from ${sender}`);
    } catch (error) {
      console.error(`Error handling answer from ${sender}:`, error);
    }
  };

  const handleIceCandidate = async (data: WebRTCIceCandidate) => {
    const sender = data.sender;
    console.log(`32 Handling ICE candidate from ${sender}`);
    const pc = peerConnections.current.get(sender);
    if (!pc) {
      console.warn(`No peer connection for ${sender} to handle ICE candidate`);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.data));
      console.log(`33 Added ICE candidate from ${sender}`);
    } catch (error) {
      console.error(`Error adding ICE candidate from ${sender}:`, error);
    }
  };

  const handleUserLeft = (userEmail: string) => {
    console.log(`34 ${userEmail} left, cleaning up`);
    const pc = peerConnections.current.get(userEmail);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userEmail);
    }
    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      delete newStreams[userEmail];
      console.log(`35 ${userEmail} removed from streams`);
      return newStreams;
    });
    setConnectionStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[userEmail];
      return newStatus;
    });
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send chat message: invalid input or WebSocket not ready');
      return;
    }

    const message: ChatMessage = {
      type: 'chat_message',
      message: chatInput,
      sender: userEmail,
    };
    wsRef.current.send(JSON.stringify(message));
    setChatInput('');
  };

  const toggleMute = () => {
    if (videoStream) {
      const audioTrack = videoStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    navigate(`/room/${room_id}`);
  };

  if (error) {
    return (
      <div className="text-center text-xl text-red-500 p-10">
        {error}
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!room) {
    return <div className="text-center text-xl text-gray-300 p-10 animate-pulse">Loading room...</div>;
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="flex min-h-screen pt-16">
        {/* Main Video Section */}
        <div className="flex-1 p-6 lg:p-8">
          <div className="bg-gray-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-700/50">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Video Call - {room.name}
            </h1>
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Local Video */}
              <div className="text-center">
                <p className="mb-2 text-gray-300 font-medium">You ({userEmail})</p>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full max-w-md rounded-xl shadow-lg border border-gray-700/50"
                  onError={(e) => console.error('Local video error:', e)}
                />
              </div>
              {/* Remote Videos */}
              {Object.entries(remoteStreams).length === 0 && (
                <p className="text-gray-400 col-span-full text-center py-8">
                  Waiting for other participants...
                </p>
              )}
              {Object.entries(remoteStreams).map(([email, stream]) => {
                console.log(`Rendering video box for ${email}`);
                return (
                  <div key={email} className="text-center">
                    <p className="mb-2 text-gray-300 font-medium">
                      {email} ({connectionStatus[email] || 'connecting'})
                    </p>
                    <video
                      autoPlay
                      playsInline
                      className="w-full max-w-md rounded-xl shadow-lg border border-gray-700/50"
                      ref={(el) => {
                        if (el && stream) {
                          console.log(`Assigning stream to video for ${email}:`, stream);
                          el.srcObject = stream;
                          el.play().catch((e) =>
                            console.error(`Error playing video for ${email}:`, e)
                          );
                        }
                      }}
                      onError={(e) => console.error(`Remote video error for ${email}:`, e)}
                    />
                  </div>
                );
              })}
            </div>
            {/* Controls */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={toggleMute}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-md"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={endCall}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold hover:from-red-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-md"
              >
                End Call
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar (Participants + Chat) */}
        <div className="w-full lg:w-80 bg-gray-900/30 backdrop-blur-xl border-l border-gray-700/50 p-6 flex flex-col h-screen fixed lg:static right-0 top-0">
          {/* Participants Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Participants</h2>
            {room.participants.length > 0 ? (
              <ul className="space-y-3 text-gray-200">
                {room.participants.map((participant) => (
                  <li
                    key={participant}
                    className="p-3 rounded-xl bg-gray-700/40 hover:bg-gray-700/60 transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    {participant}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No participants yet</p>
            )}
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 flex ${
                    msg.sender === userEmail ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === userEmail
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <span className="text-xs text-gray-400 block mb-1">{msg.sender}</span>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;