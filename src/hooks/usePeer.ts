import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { CallState } from '../types';

export function usePeer(uid: string | undefined) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isCalling: false,
    incoming: false,
    active: false,
  });
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!uid) return;

    const newPeer = new Peer(uid, {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
    });

    newPeer.on('open', (id) => {
      console.log('Peer connected with ID:', id);
    });

    newPeer.on('call', (call) => {
      setCallState(prev => ({ ...prev, incoming: true, remoteUid: call.peer }));
      
      // Global store for access
      (window as any).incomingCall = call;
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, [uid]);

  const startCall = async (remoteUid: string, type: 'video' | 'voice') => {
    if (!peer || !uid) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      localStreamRef.current = stream;

      const call = peer.call(remoteUid, stream);
      setCallState({
        isCalling: true,
        incoming: false,
        active: false,
        remoteUid,
        type,
        stream,
      });

      call.on('stream', (remoteStream) => {
        setCallState(prev => ({ ...prev, active: true, stream: remoteStream }));
      });

      call.on('close', () => {
        endCall();
      });
    } catch (err) {
      console.error('Call error:', err);
    }
  };

  const answerCall = async () => {
    const call = (window as any).incomingCall;
    if (!call) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, // simplified for demo
        audio: true,
      });
      localStreamRef.current = stream;
      call.answer(stream);

      setCallState({
        isCalling: false,
        incoming: false,
        active: true,
        remoteUid: call.peer,
        stream,
      });

      call.on('stream', (remoteStream: MediaStream) => {
        setCallState(prev => ({ ...prev, stream: remoteStream }));
      });
    } catch (err) {
      console.error('Answer error:', err);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setCallState({ isCalling: false, incoming: false, active: false });
  };

  return { peer, callState, startCall, answerCall, endCall };
}
