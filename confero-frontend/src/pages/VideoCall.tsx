import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../Store/authStore';


interface Message {
  type: string;
  message?: string;
  sender?: string;
  data?: any;
}

const VideoCall: React.FC = () => {
  const [roomId] = useState('1');
//   const [jwtToken] = useState('your-jwt-token-here'); // Replace with actual token
  const [messages, setMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);


  const jwtToken = useAuthStore.getState().accessToken;

  useEffect(() => {
    // Initialize WebSocket with token as query param
    const ws = new WebSocket(`ws://localhost:8001/ws/room/${roomId}/?token=${jwtToken}`);
    wsRef.current = ws;

    // Initialize WebRTC
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnectionRef.current = pc;

    // Get local media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((err) => console.error('Error accessing media devices:', err));

    // WebRTC event handlers
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'ice_candidate',
            data: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // WebSocket event handlers
    ws.onopen = () => {
      console.log('WebSocket connected');
      createOffer();
    };

    ws.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => {
      ws.close();
      pc.close();
    };
  }, [roomId, jwtToken]);

  const createOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !wsRef.current) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current.send(
        JSON.stringify({
          type: 'webrtc_offer',
          data: offer,
        })
      );
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleMessage = async (data: Message) => {
    const pc = peerConnectionRef.current;
    if (!pc || !wsRef.current) return;

    switch (data.type) {
      case 'chat_message':
        setMessages((prev) => [...prev, `${data.sender}: ${data.message}`]);
        break;
      case 'webrtc_offer':
        await pc.setRemoteDescription(new RTCSessionDescription(data.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc_answer',
            data: answer,
          })
        );
        break;
      case 'webrtc_answer':
        await pc.setRemoteDescription(new RTCSessionDescription(data.data));
        break;
      case 'ice_candidate':
        await pc.addIceCandidate(new RTCIceCandidate(data.data));
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          message: chatInput,
        })
      );
      setChatInput('');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Video Call Test - Room {roomId}</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h3>Local Video</h3>
          <video ref={localVideoRef} autoPlay muted style={{ width: '300px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <h3>Remote Video</h3>
          <video ref={remoteVideoRef} autoPlay style={{ width: '300px', border: '1px solid #ccc' }} />
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Chat</h3>
        <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          style={{ width: '300px', marginTop: '10px' }}
        />
        <button onClick={sendChatMessage} style={{ marginLeft: '10px' }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default VideoCall;