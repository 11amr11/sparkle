import React from 'react';
import { PhoneOff, Mic, MicOff } from 'lucide-react';

interface CallScreenProps {
    remoteStream: MediaStream | null;
    onEndCall: () => void;
    onToggleMic: () => void;
    isMuted: boolean;
    remoteUserName?: string;
    callDuration?: string;
}

const CallScreen = ({ remoteStream, onEndCall, onToggleMic, isMuted, remoteUserName = 'Unknown', callDuration }: CallScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white animate-fade-in">
            <div className="flex flex-col items-center space-y-8">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold shadow-2xl animate-pulse">
                    {remoteUserName[0]?.toUpperCase()}
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">{remoteUserName}</h2>
                    {callDuration ? (
                        <p className="text-primary text-xl font-mono font-semibold">{callDuration}</p>
                    ) : (
                        <p className="text-slate-400 text-lg">{remoteStream ? 'Connected' : 'Calling...'}</p>
                    )}
                </div>
            </div>

            <div className="absolute bottom-12 flex items-center space-x-8">
                <button
                    onClick={onToggleMic}
                    className={`p-5 rounded-full transition-all duration-300 shadow-lg ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800/50 backdrop-blur-md text-white hover:bg-slate-700'}`}
                >
                    {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <button
                    onClick={onEndCall}
                    className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-300 shadow-lg text-white transform hover:scale-110"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>
            </div>

            {/* Audio element for remote stream */}
            {remoteStream && (
                <audio
                    autoPlay
                    ref={(audio) => {
                        if (audio) audio.srcObject = remoteStream;
                    }}
                />
            )}
        </div>
    );
};

export default CallScreen;
