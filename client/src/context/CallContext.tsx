import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';
import { userApi } from '../services/api';
import IncomingCallScreen from '../components/call/IncomingCallScreen';
import CallScreen from '../components/call/CallScreen';

interface CallContextType {
    startCall: (userId: string, userName: string, userAvatar?: string) => void;
    endCall: () => void;
    toggleMic: () => void;
    isMuted: boolean;
    callState: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'busy' | 'ended';
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a CallProvider');
    return context;
};

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
    ],
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
    const socket = useSocket();
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'connected' | 'busy' | 'ended'>('idle');
    const [callerInfo, setCallerInfo] = useState<{ id: string; name: string; avatar?: string } | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [pendingOffer, setPendingOffer] = useState<any>(null);
    const [callDuration, setCallDuration] = useState(0);
    const ringIntervalRef = useRef<number | null>(null);
    const callTimerRef = useRef<number | null>(null);
    const callSessionRef = useRef({ otherUserId: '', socketInstance: null as any });
    const callStateRef = useRef<'idle' | 'outgoing' | 'incoming' | 'connected' | 'busy' | 'ended'>('idle');

    useEffect(() => {
        callSessionRef.current.socketInstance = socket;
    }, [socket]);

    useEffect(() => {
        callSessionRef.current.otherUserId = callerInfo?.id || '';
    }, [callerInfo]);

    useEffect(() => {
        callStateRef.current = callState;
    }, [callState]);

    const playSound = (type: 'ring' | 'end' | 'connected') => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'ring') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1.5);
        } else if (type === 'end') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    };

    const startRinging = () => {
        stopRinging();
        playSound('ring');
        ringIntervalRef.current = setInterval(() => playSound('ring'), 2000);
    };

    const stopRinging = () => {
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
    };

    const startCallTimer = () => {
        stopCallTimer();
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const stopCallTimer = () => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
        setCallDuration(0);
    };

    const declineCall = () => {
        const userId = callSessionRef.current.otherUserId;
        const sock = callSessionRef.current.socketInstance;

        if (userId && sock) {
            sock.emit('call:declined', { toUserId: userId });
        }

        stopRinging();
        setCallState('idle');
        setCallerInfo(null);
        setPendingOffer(null);
        callSessionRef.current.otherUserId = '';
        playSound('end');
    };

    const endCall = (remoteEnded?: any) => {
        const isRemoteEnded = remoteEnded === true;
        const userId = callSessionRef.current.otherUserId;
        const sock = callSessionRef.current.socketInstance;
        const wasConnected = callStateRef.current === 'connected';

        console.log('[EndCall] Debug:', {
            isRemoteEnded,
            callState: callStateRef.current,
            wasConnected,
            userId,
            hasCallerInfo: !!callerInfo
        });

        if (!isRemoteEnded && userId && sock) {
            sock.emit('call:end', { toUserId: userId });
        }

        stopRinging();
        stopCallTimer();

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        setRemoteStream(null);
        setPendingOffer(null);
        setIsMuted(false);

        // Show "Call Ended" if was connected (for both local and remote hangup)
        if (wasConnected) {
            console.log('[EndCall] Showing Call Ended screen');
            setCallState('ended');
            playSound('end');
            // Keep callerInfo for the "Call Ended" screen, clear after 3 seconds
            setTimeout(() => {
                console.log('[EndCall] Clearing after 3 seconds');
                setCallState('idle');
                setCallerInfo(null);
                callSessionRef.current.otherUserId = '';
            }, 3000);
        } else {
            console.log('[EndCall] Not showing Call Ended (wasConnected=false)');
            // If wasn't connected (e.g., declined during ringing)
            setCallState('idle');
            setCallerInfo(null);
            callSessionRef.current.otherUserId = '';
            playSound('end');
        }
    };

    useEffect(() => {
        if (!socket) return;

        const onOffer = async ({ fromUserId, sdp }: any) => {
            try {
                const { data } = await userApi.getUser(fromUserId);
                setCallerInfo({ id: fromUserId, name: data.name, avatar: data.avatarUrl });
            } catch (e) {
                setCallerInfo({ id: fromUserId, name: 'Unknown', avatar: undefined });
            }
            setPendingOffer(sdp);
            setCallState('incoming');
            startRinging();
        };

        const onAnswer = async ({ sdp }: any) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
                setCallState('connected');
                stopRinging();
                startCallTimer();
                playSound('connected');
            }
        };

        const onCandidate = async ({ candidate }: any) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        const onEnd = () => {
            console.log('[OnEnd] Received call:end from remote');
            stopRinging();
            endCall(true);
        };

        const onDeclined = () => {
            stopRinging();
            setCallState('busy');
            playSound('end');
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            callSessionRef.current.otherUserId = '';
            setTimeout(() => {
                setCallState('idle');
                setCallerInfo(null);
            }, 3000);
        };

        socket.on('call:offer', onOffer);
        socket.on('call:answer', onAnswer);
        socket.on('call:candidate', onCandidate);
        socket.on('call:end', onEnd);
        socket.on('call:declined', onDeclined);

        return () => {
            socket.off('call:offer', onOffer);
            socket.off('call:answer', onAnswer);
            socket.off('call:candidate', onCandidate);
            socket.off('call:end', onEnd);
            socket.off('call:declined', onDeclined);
        };
    }, [socket]);

    const initPeer = () => {
        peerConnection.current = new RTCPeerConnection(STUN_SERVERS);
        peerConnection.current.onicecandidate = (e) => {
            if (e.candidate && callSessionRef.current.otherUserId && callSessionRef.current.socketInstance) {
                callSessionRef.current.socketInstance.emit('call:candidate', {
                    toUserId: callSessionRef.current.otherUserId,
                    candidate: e.candidate
                });
            }
        };
        peerConnection.current.ontrack = (e) => setRemoteStream(e.streams[0]);
    };

    const startCall = async (userId: string, userName: string, userAvatar?: string) => {
        if (!socket) return;

        callSessionRef.current.otherUserId = userId;
        setCallerInfo({ id: userId, name: userName, avatar: userAvatar });
        setCallState('outgoing');
        initPeer();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            stream.getTracks().forEach(t => peerConnection.current?.addTrack(t, stream));
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            socket.emit('call:offer', { toUserId: userId, sdp: offer });
            startRinging();
        } catch (err) {
            console.error('StartCall error:', err);
            endCall();
        }
    };

    const acceptCall = async () => {
        const currentUserId = callSessionRef.current.otherUserId;
        if (!socket || !pendingOffer || !currentUserId) return;

        initPeer();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            stream.getTracks().forEach(t => peerConnection.current?.addTrack(t, stream));
            await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(pendingOffer));
            const answer = await peerConnection.current!.createAnswer();
            await peerConnection.current!.setLocalDescription(answer);
            socket.emit('call:answer', { toUserId: currentUserId, sdp: answer });
            setCallState('connected');
            stopRinging();
            startCallTimer();
            playSound('connected');
        } catch (err) {
            console.error('AcceptCall error:', err);
            endCall();
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const enabled = !localStream.getAudioTracks()[0].enabled;
            localStream.getAudioTracks().forEach(t => t.enabled = enabled);
            setIsMuted(!enabled);
        }
    };

    const formatCallDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <CallContext.Provider value={{ startCall, endCall, toggleMic, isMuted, callState }}>
            {children}
            {callState === 'incoming' && callerInfo && (
                <IncomingCallScreen
                    callerName={callerInfo.name}
                    callerAvatar={callerInfo.avatar}
                    onAccept={acceptCall}
                    onReject={declineCall}
                />
            )}
            {callState === 'busy' && callerInfo && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📵</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{callerInfo.name}</h2>
                        <p className="text-gray-400 text-lg">Busy</p>
                    </div>
                </div>
            )}
            {callState === 'ended' && callerInfo && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📞</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{callerInfo.name}</h2>
                        <p className="text-gray-400 text-lg">Call Ended</p>
                    </div>
                </div>
            )}
            {(callState === 'connected' || callState === 'outgoing') && callerInfo && (
                <CallScreen
                    remoteStream={remoteStream}
                    onEndCall={endCall}
                    onToggleMic={toggleMic}
                    isMuted={isMuted}
                    remoteUserName={callerInfo.name}
                    callDuration={callState === 'connected' ? formatCallDuration(callDuration) : undefined}
                />
            )}
        </CallContext.Provider>
    );
};
