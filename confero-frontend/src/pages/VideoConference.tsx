import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../Store/authStore';

interface VideoConferenceProps {
  roomId: number;
}

const VideoConference: React.FC<VideoConferenceProps> = ({ roomId }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/room/${roomId}/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    setWs(socket);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = handleMessage;
    socket.onclose = () => console.log('WebSocket disconnected');

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((err) => console.error('Error accessing media devices:', err));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        ws.send(
          JSON.stringify({
            type: 'ice_candidate',
            data: event.candidate,
          })
        );
      }
    };

    return () => {
      socket.close();
      pc.close();
    };
  }, [roomId, token]);

  const handleMessage = async (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    const pc = pcRef.current;
    if (!pc || !ws) return;

    switch (data.type) {
      case 'webrtc_offer':
        await pc.setRemoteDescription(new RTCSessionDescription(data.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'webrtc_answer', data: answer }));
        break;
      case 'webrtc_answer':
        await pc.setRemoteDescription(new RTCSessionDescription(data.data));
        break;
      case 'ice_candidate':
        await pc.addIceCandidate(new RTCIceCandidate(data.data));
        break;
      case 'user_joined':
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'webrtc_offer', data: offer }));
        break;
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-2xl font-semibold text-indigo-300 mb-4">Video Conference</h3>
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay muted className="w-1/2 border rounded-lg bg-gray-800/50" />
        <video ref={remoteVideoRef} autoPlay className="w-1/2 border rounded-lg bg-gray-800/50" />
      </div>
    </div>
  );
};

export default VideoConference;