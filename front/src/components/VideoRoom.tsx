import { useEffect, useRef, useState } from 'react';
import { getToken, refreshTokens } from '../auth';

interface VideoRoomProps {
  roomId: string;
  onLeave: () => void;
}

function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [disconnected, setDisconnected] = useState(false);
  const [connectKey, setConnectKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDisconnected(false);
    setStatus('Connecting...');

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/signaling`);
      wsRef.current = ws;

      ws.onopen = async () => {
        let token = getToken();
        try { token = await refreshTokens(); } catch { /* use existing */ }
        ws.send(JSON.stringify({
          type: 'join',
          roomId,
          token,
        }));
        setStatus('Waiting for peer...');
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'peer-joined':
            await createOffer();
            break;

          case 'offer':
            await handleOffer(msg.payload);
            break;

          case 'answer':
            await handleAnswer(msg.payload);
            break;

          case 'ice-candidate':
            await handleIceCandidate(msg.payload);
            break;

          case 'peer-left':
            setStatus('Peer disconnected');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            closePeerConnection();
            break;

          case 'force-disconnect':
            alert('This room has been closed by an administrator.');
            wsRef.current?.close();
            pcRef.current?.close();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            onLeave();
            return;

          case 'error':
            setStatus(`Error: ${msg.error}`);
            break;
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setStatus('Disconnected');
          setDisconnected(true);
        }
      };
    };

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStatus('Connected');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            roomId,
            payload: event.candidate,
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setStatus('Peer disconnected');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
      };

      return pc;
    };

    const closePeerConnection = () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };

    const createOffer = async () => {
      closePeerConnection();
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        roomId,
        payload: pc.localDescription,
      }));
      setStatus('Connecting to peer...');
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      closePeerConnection();
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        roomId,
        payload: pc.localDescription,
      }));
      setStatus('Connecting to peer...');
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    start();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'leave' }));
        }
        wsRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [roomId, connectKey]);

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const handleLeave = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave' }));
    }
    wsRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    onLeave();
  };

  const handleReconnect = () => {
    wsRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMicOn(true);
    setCamOn(true);
    setConnectKey(k => k + 1);
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#0e0e1a',
    borderRadius: '12px',
    objectFit: 'cover',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed',
      inset: 0,
    }}>
      {/* Status bar */}
      <div style={{
        padding: '8px 16px',
        color: '#a0a0b8',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: status === 'Connected' ? '#43b581' : status.startsWith('Error') ? '#f04747' : '#faa61a',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span
          onClick={() => {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#e0e0e8',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.5px',
            backgroundColor: '#16213e',
            padding: '2px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          title="Click to copy room ID"
        >
          {copied ? 'Copied!' : roomId}
        </span>
        <span style={{ color: '#5c5c7a' }}>|</span>
        <span>{status}</span>
      </div>

      {/* Video area */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8px 80px 8px',
        minHeight: 0,
      }}>
        {/* Desktop: side by side. Mobile: stack vertically */}
        <div style={{
          display: 'flex',
          gap: '8px',
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{
            position: 'relative',
            flex: '1 1 300px',
            maxWidth: '600px',
            aspectRatio: '4/3',
            minWidth: 0,
            maxHeight: 'calc(50vh - 60px)',
          }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={videoStyle} />
            <span style={labelStyle}>You</span>
          </div>
          <div style={{
            position: 'relative',
            flex: '1 1 300px',
            maxWidth: '600px',
            aspectRatio: '4/3',
            minWidth: 0,
            maxHeight: 'calc(50vh - 60px)',
          }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={videoStyle} />
            <span style={labelStyle}>Remote</span>
          </div>
        </div>
      </div>

      {/* Disconnected overlay */}
      {disconnected && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          gap: '14px',
          padding: '20px',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f04747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <span style={{ color: '#e0e0e8', fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>Connection lost</span>
          <span style={{ color: '#8888a8', fontSize: '14px', textAlign: 'center' }}>You have been disconnected from the room</span>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleReconnect}
              style={{
                padding: '12px 28px',
                backgroundColor: '#43b581',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Reconnect
            </button>
            <button
              onClick={handleLeave}
              style={{
                padding: '12px 28px',
                backgroundColor: '#3b3d54',
                color: '#e0e0e8',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Control bar */}
      <div style={{
        position: 'fixed',
        bottom: 'env(safe-area-inset-bottom, 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '16px',
        backgroundColor: 'rgba(30, 31, 46, 0.95)',
        padding: '10px 20px',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        marginBottom: '8px',
      }}>
        <button
          onClick={toggleMic}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: micOn ? '#3b3d54' : '#f04747',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {micOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .97-.2 1.9-.57 2.74"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        <button
          onClick={toggleCam}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: camOn ? '#3b3d54' : '#f04747',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {camOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
            </svg>
          )}
        </button>

        <button
          onClick={handleLeave}
          title="Leave meeting"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f04747',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z"/>
            <line x1="23" y1="1" x2="17" y2="7"/>
            <line x1="17" y1="1" x2="23" y2="7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default VideoRoom;
