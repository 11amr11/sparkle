import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { chatApi } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/useAuthStore';

interface Conversation {
    _id: string;
    participants: any[];
    lastMessage?: {
        content: string;
        createdAt: string;
        type: string;
    };
    updatedAt: string;
}

const ChatList = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const currentUser = useAuthStore((state) => state.user);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const { data } = await chatApi.getConversations();
                setConversations(data);
            } catch (error) {
                console.error('Failed to fetch conversations', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('message:received', (message: any) => {
            setConversations((prev) => {
                const index = prev.findIndex((c) => c._id === message.conversationId);
                if (index !== -1) {
                    const updated = { ...prev[index], lastMessage: message, updatedAt: new Date().toISOString() };
                    const newConversations = [...prev];
                    newConversations.splice(index, 1);
                    newConversations.unshift(updated);
                    return newConversations;
                }
                return prev;
            });
        });

        return () => {
            socket.off('message:received');
        };
    }, [socket]);

    if (loading) return <div className="p-4">Loading chats...</div>;

    return (
        <div className="p-4 space-y-4 pb-20">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Chats</h1>
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {currentUser?.avatarUrl && <img src={currentUser.avatarUrl} alt="Profile" className="h-full w-full object-cover" />}
                </div>
            </header>

            <div className="space-y-2">
                {conversations.map((chat) => {
                    const otherUser = chat.participants.find((p) => p._id !== currentUser?._id);
                    return (
                        <Link
                            key={chat._id}
                            to={`/chat/${chat._id}`}
                            className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="relative">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                                    {otherUser?.avatarUrl ? (
                                        <img src={otherUser.avatarUrl} alt={otherUser.name} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        otherUser?.name?.[0]
                                    )}
                                </div>
                                {otherUser?.isOnline && (
                                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-950 ring-1 ring-green-500/20" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                        {otherUser?.name || 'Unknown User'}
                                    </h3>
                                    {chat.lastMessage && (
                                        <span className="text-xs text-slate-500 font-medium">
                                            {format(new Date(chat.lastMessage.createdAt), 'h:mm a')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {chat.lastMessage?.type === 'image' ? '📷 Image' : chat.lastMessage?.content || 'No messages yet'}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
