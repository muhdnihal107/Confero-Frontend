// import React, { useEffect, useState, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { fetchRoomDetails, Room, connectToRoomWebSocket, sendWebRTCSignal, closeWebSocket } from '../api/room';
// import { useAuthStore } from '../Store/authStore';
// import DOMPurify from 'dompurify';
// import 'webrtc-adapter';
// import * as Sentry from '@sentry/react';

// // Interfaces for WebSocket messages
// interface ChatMessage {
//   type: 'chat_message';
//   message: string;
//   sender: string;
// }

// interface WebRTCOffer {
//   type: 'webrtc_offer';
//   data: RTCSessionDescriptionInit;
//   sender: string;
// }

// interface WebRTCAnswer {
//   type: 'webrtc_answer';
//   data: RTCSessionDescriptionInit;
//   sender: string;
// }

// interface WebRTCIceCandidate {
//   type: 'ice_candidate';
//   data: RTCIceCandidateInit;
//   sender: string;
// }

// interface WebRTCSignalMessage {
//   type: 'webrtc_offer' | 'webrtc_answer' | 'ice_candidate';
//   data: RTCSessionDescriptionInit | RTCIceCandidateInit;
//   sender: string;
//   target?: string;
// }

// interface UserJoined {
//   type: 'user_joined';
//   user_email: string;
// }

// interface UserLeft {
//   type: 'user_left';
//   user_email: string;
// }

// type WebSocketMessage = ChatMessage | WebRTCOffer | WebRTCAnswer | WebRTCIceCandidate | UserJoined | UserLeft;

// const VideoCall: React.FC = () => {
//   const { room_id } = useParams<{ room_id: string }>();
//   const navigate = useNavigate();
//   const [room, setRoom] = useState<Room | null>(null);
//   const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
//   const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
//   const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
//   const [chatInput, setChatInput] = useState('');
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOn, setIsVideoOn] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);
//   const peerConnections = useRef<Map<string, RTCPeerConnection | true>>(new Map());
//   const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
//   const pendingSignals = useRef<WebRTCSignalMessage[]>([]);
//   const pendingChatMessages = useRef<ChatMessage[]>([]);
//   const reconnectAttempts = useRef(0);
//   const { user } = useAuthStore();
//   const userEmail = user?.email || 'unknown';

//   useEffect(() => {
//     Sentry.init({ dsn: 'your-sentry-dsn' });
//   }, []);

//   useEffect(() => {
//     if (!window.RTCPeerConnection) {
//       setError('Your browser does not support WebRTC.');
//     }
//   }, []);

//   useEffect(() => {
//     const loadRoom = async () => {
//       if (!room_id) {
//         setError('Invalid room ID');
//         return;
//       }
//       try {
//         const roomData = await fetchRoomDetails(room_id);
//         setRoom(roomData);
//         if (roomData.participants.length > 10) {
//           setError('Room is full. Maximum 10 participants allowed.');
//         }
//       } catch (error) {
//         Sentry.captureException(error);
//         setError('Failed to load room details');
//       }
//     };
//     loadRoom();
//   }, [room_id]);

//   useEffect(() => {
//     let stream: MediaStream | null = null;
//     const startVideo = async () => {
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({
//           video: { width: { ideal: 640 }, height: { ideal: 480 } },
//           audio: true,
//         });
//         setVideoStream(stream);
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current.play().catch((e) => {
//             console.error('Error playing local video:', e);
//             Sentry.captureException(e);
//           });
//         }
//         const tracks = stream.getTracks();
//         console.log(`Local stream tracks: ${tracks.map(t => t.kind)}`);
//         if (!tracks.some(t => t.kind === 'video')) {
//           setError('No video track available. Please enable your camera.');
//         }
//         stream.onaddtrack = (event) => {
//           console.log('New track added:', event.track.kind);
//         };
//         stream.onremovetrack = (event) => {
//           console.log('Track removed:', event.track.kind);
//           setError(`Stream track ${event.track.kind} removed.`);
//         };
//       } catch (error) {
//         Sentry.captureException(error);
//         setError('Failed to access camera. Please allow camera and microphone permissions.');
//       }
//     };
//     startVideo();
//     return () => {
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop());
//         stream.onaddtrack = null;
//         stream.onremovetrack = null;
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (!room_id) {
//       setError('Invalid room ID');
//       return;
//     }

//     const maxReconnectAttempts = 5;
//     let reconnectTimeout: NodeJS.Timeout;

//     const connectWebSocket = () => {
//       const ws = connectToRoomWebSocket(parseInt(room_id), {
//         onMessage: (event: MessageEvent) => {
//           try {
//             const data: WebSocketMessage = JSON.parse(event.data);
//             if (!data.type || !['chat_message', 'webrtc_offer', 'webrtc_answer', 'ice_candidate', 'user_joined', 'user_left'].includes(data.type)) {
//               console.warn('Invalid message type:', data);
//               return;
//             }
//             if ('sender' in data && !data.sender.includes('@')) {
//               console.warn('Invalid sender email:', data.sender);
//               return;
//             }
//             console.log(`Received WebSocket message for room ${room_id}:`, data);
//             if ('sender' in data && data.sender === userEmail) return;
//             switch (data.type) {
//               case 'chat_message':
//                 setChatMessages((prev) => [...prev, data]);
//                 break;
//               case 'webrtc_offer':
//                 handleOffer(data);
//                 break;
//               case 'webrtc_answer':
//                 handleAnswer(data);
//                 break;
//               case 'ice_candidate':
//                 handleIceCandidate(data);
//                 break;
//               case 'user_joined':
//                 if (data.user_email !== userEmail) {
//                   console.log(`User joined: ${data.user_email}`);
//                   initiateCall(data.user_email);
//                 }
//                 break;
//               case 'user_left':
//                 console.log(`User left: ${data.user_email}`);
//                 handleUserLeft(data.user_email);
//                 break;
//               default:
//                 console.warn('Unknown message type:', data);
//             }
//           } catch (error) {
//             console.error('Error processing WebSocket message:', error);
//             Sentry.captureException(error);
//           }
//         },
//         onOpen: () => {
//           console.log(`WebSocket opened for room ${room_id}`);
//           reconnectAttempts.current = 0;
//           setError(null);
//           processPendingSignals();
//           for (const msg of pendingChatMessages.current) {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(JSON.stringify(msg));
//             }
//           }
//           pendingChatMessages.current = [];
//         },
//         onError: (error) => {
//           console.error(`WebSocket error for room ${room_id}:`, error);
//           Sentry.captureException(error);
//           setError('Failed to connect to WebSocket. Retrying...');
//         },
//         onClose: (event) => {
//           console.log(`WebSocket closed for room ${room_id}, code: ${event.code}, reason: ${event.reason}`);
//           if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
//             reconnectAttempts.current++;
//             const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
//             reconnectTimeout = setTimeout(connectWebSocket, delay);
//             setError(`WebSocket disconnected. Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
//           } else if (event.code !== 1000) {
//             setError('WebSocket disconnected permanently. Please refresh.');
//           }
//         },
//       });
//       wsRef.current = ws;
//     };

//     connectWebSocket();

//     return () => {
//       clearTimeout(reconnectTimeout);
//       closeWebSocket(wsRef.current);
//     };
//   }, [room_id, userEmail]);

//   useEffect(() => {
//     if (!room || !videoStream || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       return;
//     }

//     const participants = room.participants.filter((email) => email !== userEmail);
//     participants.forEach((targetEmail) => {
//       if (!peerConnections.current.has(targetEmail)) {
//         initiateCall(targetEmail);
//       }
//     });
//   }, [room, videoStream, userEmail]);

//   useEffect(() => {
//     return () => {
//       peerConnections.current.forEach((pc, email) => {
//         if (pc instanceof RTCPeerConnection) {
//           pc.close();
//         }
//         peerConnections.current.delete(email);
//       });
//       setRemoteStreams({});
//       setConnectionStatus({});
//       remoteVideoRefs.current.clear();
//       if (videoStream) {
//         videoStream.getTracks().forEach((track) => track.stop());
//         videoStream.onaddtrack = null;
//         videoStream.onremovetrack = null;
//       }
//     };
//   }, [videoStream]);

//   useEffect(() => {
//     console.log('Remote streams updated:', Object.keys(remoteStreams));
//     Object.entries(remoteStreams).forEach(([email, stream]) => {
//       const videoEl = remoteVideoRefs.current.get(email);
//       if (videoEl && videoEl.srcObject !== stream) {
//         console.log(`Assigning stream to video element for ${email}`);
//         videoEl.srcObject = stream;
//         videoEl.play().catch((e) => {
//           console.error(`Error playing video for ${email}:`, e);
//           Sentry.captureException(e);
//         });
//       }
//     });
//   }, [remoteStreams]);

//   const createPeerConnection = (targetEmail: string) => {
//     const pc = new RTCPeerConnection({
//       iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         {
//           urls: 'turn:openrelay.metered.ca:80',
//           username: 'openrelayproject',
//           credential: 'openrelayproject',
//         },
//       ],
//     });

//     const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
//       if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
//         console.log(`Sending ICE candidate to ${targetEmail}`);
//         sendWebRTCSignal(wsRef.current, 'ice_candidate', event.candidate, targetEmail, userEmail);
//       } else if (event.candidate) {
//         console.warn(`Cannot send ICE candidate to ${targetEmail}: WebSocket is not ready`);
//         pendingSignals.current.push({
//           type: 'ice_candidate',
//           data: event.candidate,
//           sender: userEmail,
//           target: targetEmail,
//         });
//       }
//     };

//     const handleTrack = (event: RTCTrackEvent) => {
//       if (event.streams[0]) {
//         console.log(`Received stream for ${targetEmail}:`, event.streams[0]);
//         console.log(`Stream tracks: ${event.streams[0].getTracks().map(t => t.kind)}`);
//         setRemoteStreams((prev) => ({
//           ...prev,
//           [targetEmail]: event.streams[0],
//         }));
//       } else {
//         console.warn(`No streams received for ${targetEmail} in ontrack event`);
//       }
//     };

//     const handleConnectionStateChange = () => {
//       console.log(`Connection state for ${targetEmail}: ${pc.connectionState}`);
//       setConnectionStatus((prev) => ({
//         ...prev,
//         [targetEmail]: pc.connectionState,
//       }));
//       if (pc.connectionState === 'failed') {
//         handleUserLeft(targetEmail);
//         setTimeout(() => initiateCall(targetEmail), 5000);
//       }
//     };

//     pc.onicecandidate = handleIceCandidate;
//     pc.ontrack = handleTrack;
//     pc.onconnectionstatechange = handleConnectionStateChange;
//     pc.onicecandidateerror = (event) => {
//       console.error(`ICE candidate error for ${targetEmail}:`, event);
//       Sentry.captureException(event);
//     };

//     if (videoStream) {
//       const videoTracks = videoStream.getVideoTracks();
//       const audioTracks = videoStream.getAudioTracks();
//       if (videoTracks.length === 0) {
//         console.warn(`No video tracks available for ${targetEmail}`);
//         setError('No video track available. Please enable your camera.');
//       }
//       videoTracks.forEach((track) => {
//         console.log(`Adding video track: ${track.id}`);
//         pc.addTrack(track, videoStream);
//       });
//       audioTracks.forEach((track) => {
//         console.log(`Adding audio track: ${track.id}`);
//         pc.addTrack(track, videoStream);
//       });
//     } else {
//       console.warn(`No videoStream available for ${targetEmail}`);
//       setError('Local stream not initialized. Please check camera permissions.');
//     }

//     peerConnections.current.set(targetEmail, pc);

//     return () => {
//       pc.onicecandidate = null;
//       pc.ontrack = null;
//       pc.onconnectionstatechange = null;
//       pc.onicecandidateerror = null;
//       pc.close();
//     };
//   };

//   const initiateCall = async (targetEmail: string) => {
//     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       setTimeout(() => initiateCall(targetEmail), 1000);
//       return;
//     }
//     if (!videoStream) {
//       console.warn(`Cannot initiate call to ${targetEmail}: videoStream not ready`);
//       setError('Local stream not initialized. Retrying in 1s...');
//       setTimeout(() => initiateCall(targetEmail), 1000);
//       return;
//     }

//     const pc = peerConnections.current.get(targetEmail);
//     if (pc instanceof RTCPeerConnection && pc.signalingState !== 'closed' && pc.signalingState !== 'stable') {
//       console.log(`Skipping initiateCall for ${targetEmail}: Peer connection is negotiating`);
//       return;
//     }

//     if (!(pc instanceof RTCPeerConnection) || pc.signalingState === 'closed') {
//       const cleanup = createPeerConnection(targetEmail);
//       const newPc = peerConnections.current.get(targetEmail) as RTCPeerConnection;
//       try {
//         const offer = await newPc.createOffer();
//         await newPc.setLocalDescription(offer);
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//           console.log(`Sending offer to ${targetEmail}`, offer);
//           sendWebRTCSignal(wsRef.current, 'webrtc_offer', offer, targetEmail, userEmail);
//         } else {
//           console.warn(`Cannot send WebRTC offer to ${targetEmail}: WebSocket is not ready`);
//           pendingSignals.current.push({
//             type: 'webrtc_offer',
//             data: offer,
//             sender: userEmail,
//             target: targetEmail,
//           });
//         }
//       } catch (error) {
//         console.error(`Failed to initiate call to ${targetEmail}:`, error);
//         Sentry.captureException(error);
//         cleanup();
//         peerConnections.current.delete(targetEmail);
//       }
//     }
//   };

//   const handleOffer = async (data: WebRTCOffer) => {
//     const sender = data.sender;
//     let pc = peerConnections.current.get(sender);
//     if (pc instanceof RTCPeerConnection && pc.signalingState !== 'stable' && pc.signalingState !== 'closed') {
//       console.warn(`Queuing offer from ${sender}: Peer connection is in ${pc.signalingState} state`);
//       pendingSignals.current.push(data);
//       return;
//     }

//     if (!(pc instanceof RTCPeerConnection) || pc.signalingState === 'closed') {
//       createPeerConnection(sender);
//       pc = peerConnections.current.get(sender) as RTCPeerConnection;
//     }

//     try {
//       console.log(`Processing offer from ${sender}`, data.data.sdp);
//       await pc.setRemoteDescription(new RTCSessionDescription(data.data));
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//         console.log(`Sending answer to ${sender}`);
//         sendWebRTCSignal(wsRef.current, 'webrtc_answer', answer, sender, userEmail);
//       } else {
//         console.warn(`Cannot send WebRTC answer to ${sender}: WebSocket is not ready`);
//         pendingSignals.current.push({
//           type: 'webrtc_answer',
//           data: answer,
//           sender: userEmail,
//           target: sender,
//         });
//       }
//     } catch (error) {
//       console.error(`Error handling offer from ${sender}:`, error);
//       Sentry.captureException(error);
//       if (error instanceof DOMException && error.name === 'InvalidAccessError') {
//         console.log(`Resetting peer connection for ${sender} due to SDP mismatch`);
//         if (pc instanceof RTCPeerConnection) {
//           pc.close();
//           peerConnections.current.delete(sender);
//         }
//         createPeerConnection(sender);
//         pc = peerConnections.current.get(sender) as RTCPeerConnection;
//         await pc.setRemoteDescription(new RTCSessionDescription(data.data));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//           sendWebRTCSignal(wsRef.current, 'webrtc_answer', answer, sender, userEmail);
//         } else {
//           pendingSignals.current.push({
//             type: 'webrtc_answer',
//             data: answer,
//             sender: userEmail,
//             target: sender,
//           });
//         }
//       } else {
//         if (pc instanceof RTCPeerConnection) {
//           pc.close();
//           peerConnections.current.delete(sender);
//         }
//       }
//     }
//   };

//   const handleAnswer = async (data: WebRTCAnswer) => {
//     const sender = data.sender;
//     const pc = peerConnections.current.get(sender);
//     if (!(pc instanceof RTCPeerConnection)) {
//       console.warn(`No peer connection for ${sender}`);
//       pendingSignals.current.push(data);
//       return;
//     }
//     if (pc.signalingState !== 'have-local-offer') {
//       console.warn(`Ignoring answer from ${sender}: Expected have-local-offer, got ${pc.signalingState}`);
//       pendingSignals.current.push(data);
//       return;
//     }
//     if (peerConnections.current.get(`processing:${sender}`)) {
//       console.warn(`Queuing answer from ${sender}: Another answer is being processed`);
//       pendingSignals.current.push(data);
//       return;
//     }
//     peerConnections.current.set(`processing:${sender}`, true);
//     try {
//       console.log(`Processing answer from ${sender}`, { sdp: data.data.sdp });
//       await pc.setRemoteDescription(new RTCSessionDescription(data.data));
//     } catch (error) {
//       console.error(`Error handling answer from ${sender}:`, error);
//       Sentry.captureException(error);
//       if (error instanceof DOMException && error.name === 'InvalidStateError') {
//         console.log(`Resetting peer connection for ${sender} due to InvalidStateError`);
//         pc.close();
//         peerConnections.current.delete(sender);
//         peerConnections.current.delete(`processing:${sender}`);
//         pendingSignals.current.push(data);
//       }
//     } finally {
//       peerConnections.current.delete(`processing:${sender}`);
//     }
//   };

//   const handleIceCandidate = async (data: WebRTCIceCandidate) => {
//     const sender = data.sender;
//     const pc = peerConnections.current.get(sender);
//     if (!(pc instanceof RTCPeerConnection)) {
//       console.warn(`No peer connection for ${sender}`);
//       return;
//     }
//     try {
//       console.log(`Adding ICE candidate from ${sender}`);
//       await pc.addIceCandidate(new RTCIceCandidate(data.data));
//     } catch (error) {
//       console.error(`Error adding ICE candidate from ${sender}:`, error);
//       Sentry.captureException(error);
//     }
//   };

//   const handleUserLeft = (userEmail: string) => {
//     const pc = peerConnections.current.get(userEmail);
//     if (pc instanceof RTCPeerConnection) {
//       pc.close();
//       peerConnections.current.delete(userEmail);
//     }
//     peerConnections.current.delete(`processing:${userEmail}`);
//     setRemoteStreams((prev) => {
//       const newStreams = { ...prev };
//       delete newStreams[userEmail];
//       return newStreams;
//     });
//     setConnectionStatus((prev) => {
//       const newStatus = { ...prev };
//       delete newStatus[userEmail];
//       return newStatus;
//     });
//     remoteVideoRefs.current.delete(userEmail);
//   };

//   const processPendingSignals = async () => {
//     while (pendingSignals.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
//       const signal = pendingSignals.current.shift();
//       if (!signal) continue;
//       console.log(`Processing queued signal: ${signal.type} for ${signal.target}`);
//       try {
//         if (signal.type === 'webrtc_offer') {
//           await handleOffer(signal as WebRTCOffer);
//         } else if (signal.type === 'webrtc_answer') {
//           await handleAnswer(signal as WebRTCAnswer);
//         } else if (signal.type === 'ice_candidate') {
//           await handleIceCandidate(signal as WebRTCIceCandidate);
//         }
//       } catch (error) {
//         console.error(`Error processing signal for ${signal.target}:`, error);
//         Sentry.captureException(error);
//       }
//     }
//   };

//   const sendChatMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!chatInput.trim()) return;
//     const sanitizedMessage = DOMPurify.sanitize(chatInput);
//     const message: ChatMessage = {
//       type: 'chat_message',
//       message: sanitizedMessage,
//       sender: userEmail,
//     };
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify(message));
//       setChatMessages((prev) => [...prev, message]);
//     } else {
//       pendingChatMessages.current.push(message);
//       setError('Message queued due to WebSocket disconnection.');
//     }
//     setChatInput('');
//   };

//   const toggleMute = () => {
//     if (videoStream) {
//       const audioTrack = videoStream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setIsMuted(!audioTrack.enabled);
//       } else {
//         setError('No audio track available to mute.');
//       }
//     }
//   };

//   const toggleVideo = () => {
//     if (videoStream) {
//       const videoTrack = videoStream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setIsVideoOn(!videoTrack.enabled);
//       } else {
//         setError('No video track available to toggle.');
//       }
//     }
//   };

//   const endCall = () => {
//     navigate(`/room/${room_id}`);
//   };

//   const forceAssignStreams = () => {
//     Object.entries(remoteStreams).forEach(([email, stream]) => {
//       const videoEl = remoteVideoRefs.current.get(email);
//       if (videoEl) {
//         console.log(`Force assigning stream for ${email}`);
//         videoEl.srcObject = stream;
//         videoEl.play().catch((e) => console.error(`Force play error for ${email}:`, e));
//       }
//     });
//   };

//   if (!room) {
//     return <div className="text-center text-xl text-gray-300 p-10 animate-pulse">Loading room...</div>;
//   }

//   return (
//     <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
//       {error && (
//         <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
//           {error}
//           <button
//             onClick={() => setError(null)}
//             onKeyDown={(e) => e.key === 'Enter' && setError(null)}
//             tabIndex={0}
//             aria-label="Dismiss error message"
//             className="ml-4 text-sm underline"
//           >
//             Dismiss
//           </button>
//         </div>
//       )}
//       <div className="flex min-h-screen pt-16">
//         <div className="flex-1 p-6 lg:p-8">
//           <div className="bg-gray-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-700/50">
//             <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
//               Video Call - {room.name}
//             </h1>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
//               <div className="text-center">
//                 <p className="mb-2 text-gray-300 font-medium">You ({userEmail})</p>
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   muted
//                   playsInline
//                   className="w-full max-w-md rounded-xl shadow-lg border border-gray-700/50"
//                   aria-label="Your video stream"
//                 />
//               </div>
//               {Object.entries(remoteStreams).map(([email, stream]) => (
//                 <div key={email} className="text-center">
//                   <p className="mb-2 text-gray-300 font-medium">
//                     {email} ({connectionStatus[email] || 'connecting'})
//                   </p>
//                   <video
//                     ref={(el) => {
//                       remoteVideoRefs.current.set(email, el);
//                       if (el && remoteStreams[email]) {
//                         el.srcObject = remoteStreams[email];
//                         el.play().catch((e) => {
//                           console.error(`Error playing video for ${email}:`, e);
//                           Sentry.captureException(e);
//                         });
//                       }
//                     }}
//                     autoPlay
//                     playsInline
//                     className="w-full max-w-md rounded-xl shadow-lg border border-gray-700/50"
//                     aria-label={`Video stream for ${email}`}
//                   />
//                 </div>
//               ))}
//             </div>
//             <div className="flex justify-center gap-4 mt-8">
//               <button
//                 onClick={toggleMute}
//                 onKeyDown={(e) => e.key === 'Enter' && toggleMute()}
//                 tabIndex={0}
//                 aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
//                 className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700"
//               >
//                 {isMuted ? 'Unmute' : 'Mute'}
//               </button>
//               <button
//                 onClick={toggleVideo}
//                 onKeyDown={(e) => e.key === 'Enter' && toggleVideo()}
//                 tabIndex={0}
//                 aria-label={isVideoOn ? 'Turn off video' : 'Turn on video'}
//                 className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700"
//               >
//                 {isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
//               </button>
//               <button
//                 onClick={endCall}
//                 onKeyDown={(e) => e.key === 'Enter' && endCall()}
//                 tabIndex={0}
//                 aria-label="End video call"
//                 className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold hover:from-red-700 hover:to-pink-700"
//               >
//                 End Call
//               </button>
//               <button
//                 onClick={forceAssignStreams}
//                 onKeyDown={(e) => e.key === 'Enter' && forceAssignStreams()}
//                 tabIndex={0}
//                 aria-label="Force assign video streams"
//                 className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold hover:from-yellow-700 hover:to-orange-700"
//               >
//                 Debug Streams
//               </button>
//             </div>
//           </div>
//         </div>
//         <div className="w-full lg:w-80 bg-gray-900/30 backdrop-blur-xl border-l border-gray-700/50 p-6 flex flex-col h-screen lg:flex">
//           <div className="mb-8">
//             <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Participants</h2>
//             {room.participants.length > 0 ? (
//               <ul className="space-y-3 text-gray-200">
//                 {room.participants.map((participant) => (
//                   <li
//                     key={participant}
//                     className="p-3 rounded-xl bg-gray-700/40 hover:bg-gray-700/60"
//                     aria-label={`Participant: ${participant}`}
//                   >
//                     <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
//                     {participant}
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-400 italic">No participants yet</p>
//             )}
//           </div>
//           <div className="flex-1 flex flex-col">
//             <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Chat</h2>
//             <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
//               {chatMessages.map((msg, index) => (
//                 <div
//                   key={index}
//                   className={`mb-3 flex ${
//                     msg.sender === userEmail ? 'justify-end' : 'justify-start'
//                   }`}
//                 >
//                   <div
//                     className={`max-w-xs p-3 rounded-lg ${
//                       msg.sender === userEmail
//                         ? 'bg-indigo-600 text-white'
//                         : 'bg-gray-700 text-gray-200'
//                     }`}
//                     aria-label={`Message from ${msg.sender}: ${msg.message}`}
//                   >
//                     <span className="text-xs text-gray-400 block mb-1">{msg.sender}</span>
//                     {msg.message}
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <form onSubmit={sendChatMessage} className="flex gap-2">
//               <input
//                 type="text"
//                 value={chatInput}
//                 onChange={(e) => setChatInput(e.target.value)}
//                 className="flex-1 p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-white focus:ring-2 focus:ring-indigo-500"
//                 placeholder="Type a message..."
//                 aria-label="Chat message input"
//               />
//               <button
//                 type="submit"
//                 onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(e)}
//                 tabIndex={0}
//                 aria-label="Send chat message"
//                 className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700"
//               >
//                 Send
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;






import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SimplePeer, { Instance as SimplePeerInstance, SignalData } from 'simple-peer';
import { fetchRoomDetails, Room, WebRTCSignal, connectToRoomWebSocket, closeWebSocket } from '../api/room';
import { useAuthStore } from '../Store/authStore';

// Interface for peer connection
interface PeerConnection {
  peer: SimplePeerInstance;
  userEmail: string;
  stream?: MediaStream; // Remote stream for the peer
}

const VideoCall: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const { user } = useAuthStore();
  const userEmail = user?.email || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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

  // Initialize WebSocket and WebRTC
  useEffect(() => {
    if (!room_id || !userEmail || !stream) return;

    isMountedRef.current = true;
    setConnectionError(null);

    // Connect to WebSocket
    const ws = connectToRoomWebSocket(Number(room_id), {
      onMessage: (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'user-connected' && data.userEmail !== userEmail) {
            console.log(`User connected: ${data.userEmail}`);
            createPeer(data.userEmail, ws, stream);
          } else if (data.event === 'user-disconnected') {
            console.log(`User disconnected: ${data.userEmail}`);
            setPeers((prev) => prev.filter((p) => p.userEmail !== data.userEmail));
            peersRef.current.delete(data.userEmail);
          } else if (data.sender && data.sender !== userEmail) {
            const signalData = data as WebRTCSignal;
            const peer = peersRef.current.get(signalData.sender) || addPeer(signalData.sender, ws, stream);
            if (signalData.type === 'webrtc_offer' || signalData.type === 'webrtc_answer') {
              peer.signal(signalData.data as RTCSessionDescriptionInit);
            } else if (signalData.type === 'ice_candidate') {
              peer.signal({ candidate: signalData.data as RTCIceCandidateInit });
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      },
      onOpen: () => {
        console.log('WebSocket connected');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'join-room', roomId: room_id, userEmail }));
        } else {
          console.warn('WebSocket not open when trying to send join-room');
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        if (isMountedRef.current) {
          setConnectionError('WebSocket connection failed');
        }
      },
      onClose: (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
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

  // Create a new peer connection
  const createPeer = (targetEmail: string, ws: WebSocket, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers if needed
        ],
      },
    });

    peer.on('signal', (data: SignalData) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: data.type === 'offer' ? 'webrtc_offer' : 'webrtc_answer',
            data,
            target: targetEmail,
            sender: userEmail,
          } as WebRTCSignal)
        );
      } else {
        console.warn(`Cannot send signal to ${targetEmail}: WebSocket not open`);
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (isMountedRef.current) {
        setPeers((prev) => [
          ...prev.filter((p) => p.userEmail !== targetEmail), // Avoid duplicates
          { peer, userEmail: targetEmail, stream: remoteStream },
        ]);
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`Peer error with ${targetEmail}:`, err);
    });

    peersRef.current.set(targetEmail, peer);
  };

  // Add a peer for incoming connection
  const addPeer = (senderEmail: string, ws: WebSocket, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers if needed
        ],
      },
    });

    peer.on('signal', (data: SignalData) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: data.type === 'offer' ? 'webrtc_offer' : 'webrtc_answer',
            data,
            target: senderEmail,
            sender: userEmail,
          } as WebRTCSignal)
        );
      } else {
        console.warn(`Cannot send signal to ${senderEmail}: WebSocket not open`);
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      if (isMountedRef.current) {
        setPeers((prev) => [
          ...prev.filter((p) => p.userEmail !== senderEmail), // Avoid duplicates
          { peer, userEmail: senderEmail, stream: remoteStream },
        ]);
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`Peer error with ${senderEmail}:`, err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
          {room.name} - Video Call
        </h1>

        {connectionError && (
          <div className="mb-6 p-4 bg-red-900/50 rounded-lg text-red-300 text-center">
            {connectionError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Local Video */}
          <div className="relative bg-gray-800/80 rounded-2xl p-4 shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-gray-900/70 px-2 py-1 rounded-md">
              <span className="text-sm font-medium">{userEmail} (You)</span>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 rounded-full font-semibold text-white transition-all duration-300 ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 rounded-full font-semibold text-white transition-all duration-300 ${
                  !isVideoOn
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isVideoOn ? 'Video Off' : 'Video On'}
              </button>
            </div>
          </div>

          {/* Remote Videos */}
          {peers.map((peer) => (
            <div key={peer.userEmail} className="relative bg-gray-800/80 rounded-2xl p-4 shadow-lg">
              <video
                autoPlay
                ref={(el) => {
                  if (el && peer.stream) {
                    el.srcObject = peer.stream;
                  }
                }}
                className="w-full rounded-lg"
              />
              <div className="absolute bottom-4 left-4 bg-gray-900/70 px-2 py-1 rounded-md">
                <span className="text-sm font-medium">{peer.userEmail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Participants List */}
        <div className="mt-8 bg-gray-800/80 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-indigo-300 mb-4">Participants</h2>
          <ul className="space-y-2">
            {room.participants.map((participant) => (
              <li
                key={participant}
                className="p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-all duration-200"
              >
                {participant}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;