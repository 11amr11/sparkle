import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallScreenProps {
    callerName: string;
    callerAvatar?: string;
    onAccept: () => void;
    onReject: () => void;
}

const IncomingCallScreen = ({ callerName, callerAvatar, onAccept, onReject }: IncomingCallScreenProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white animate-fade-in">
            <div className="flex flex-col items-center space-y-8 mb-12">
                <div className="relative">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold shadow-2xl animate-pulse">
                        {callerAvatar ? (
                            <img src={callerAvatar} alt={callerName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            callerName[0]?.toUpperCase()
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-500 border-4 border-slate-900 animate-bounce" />
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">{callerName}</h2>
                    <p className="text-slate-300 text-lg animate-pulse">Incoming Audio Call...</p>
                </div>
            </div>

            <div className="flex items-center space-x-16">
                <button
                    onClick={onReject}
                    className="flex flex-col items-center space-y-2 group"
                >
                    <div className="p-5 rounded-full bg-red-500 group-hover:bg-red-600 transition-all duration-300 shadow-lg transform group-hover:scale-110">
                        <PhoneOff className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">Decline</span>
                </button>

                <button
                    onClick={onAccept}
                    className="flex flex-col items-center space-y-2 group"
                >
                    <div className="p-5 rounded-full bg-green-500 group-hover:bg-green-600 transition-all duration-300 shadow-lg transform group-hover:scale-110 animate-bounce">
                        <Phone className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">Accept</span>
                </button>
            </div>
        </div>
    );
};

export default IncomingCallScreen;
