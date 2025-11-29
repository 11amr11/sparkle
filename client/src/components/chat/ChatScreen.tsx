import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Phone, Video, Trash2, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { format } from 'date-fns';
import { chatApi } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCall } from '../../context/CallContext';

const ChatScreen = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const socket = useSocket();
    const currentUser = useAuthStore((state) => state.user);
    const { startCall } = useCall();

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversation, setConversation] = useState<any>(null);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
    };

    // Get other participant ID for calling
    const otherParticipant = conversation?.participants.find((p: any) => p._id !== currentUser?._id);

    const handleStartCall = () => {
        if (otherParticipant) {
            startCall(otherParticipant._id, otherParticipant.name, otherParticipant.avatarUrl);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (type: 'me' | 'everyone') => {
        if (!deletingMessageId) return;
        try {
            await chatApi.deleteMessage(deletingMessageId, type);
            // Optimistic update
            if (type === 'me') {
                setMessages((prev) => prev.filter(msg => msg._id !== deletingMessageId));
            } else {
                setMessages((prev) => prev.map(msg =>
                    msg._id === deletingMessageId
                        ? { ...msg, content: 'This message was deleted', type: 'system', mediaUrl: null }
                        : msg
                ));
            }
            setDeletingMessageId(null);
        } catch (error) {
            console.error('Failed to delete message', error);
        }
    };

    const handleMessagePress = (messageId: string, isMyMessage: boolean) => {
        if (isMyMessage) {
            setDeletingMessageId(messageId);
        }
    };

    const handleMouseDown = (messageId: string, isMyMessage: boolean) => {
        if (!isMyMessage) return;
        const timer = window.setTimeout(() => {
            setDeletingMessageId(messageId);
        }, 500); // Long press after 500ms
        setLongPressTimer(timer);
    };

    const handleMouseUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!id) return;
            try {
                const { data } = await chatApi.getMessages(id);
                setMessages(data);

                // Also fetch conversation details to get participants
                const convs = await chatApi.getConversations();
                const currentConv = convs.data.find((c: any) => c._id === id);
                setConversation(currentConv);

                scrollToBottom();
            } catch (error) {
                console.error('Failed to fetch messages', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [id]);

    useEffect(() => {
        if (!socket || !id) return;

        socket.emit('join:conversation', id);

        const handleMessage = (message: any) => {
            if (message.conversationId === id) {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            }
        };

        socket.on('message:received', handleMessage);

        return () => {
            socket.off('message:received', handleMessage);
        };
    }, [socket, id]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !id) return;

        const tempId = Date.now().toString();
        const messageData = {
            conversationId: id,
            content: newMessage,
            type: 'text',
            tempId,
        };

        // Optimistic update
        setMessages((prev) => [
            ...prev,
            {
                _id: tempId,
                senderId: { _id: currentUser?._id },
                content: newMessage,
                type: 'text',
                createdAt: new Date().toISOString(),
            },
        ]);

        socket.emit('message:send', messageData);
        setNewMessage('');
        scrollToBottom();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('image', file);

            try {
                const { data } = await chatApi.uploadImage(formData);

                const tempId = Date.now().toString();
                const messageData = {
                    conversationId: id,
                    content: 'Image',
                    type: 'image',
                    mediaUrl: data.url,
                    tempId,
                };

                setMessages((prev) => [
                    ...prev,
                    {
                        _id: tempId,
                        senderId: { _id: currentUser?._id },
                        content: 'Image',
                        type: 'image',
                        mediaUrl: data.url,
                        createdAt: new Date().toISOString(),
                    },
                ]);

                socket?.emit('message:send', messageData);
                scrollToBottom();
            } catch (error) {
                console.error('Failed to upload image', error);
            }
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
            {/* Delete Modal */}
            {deletingMessageId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl w-full max-w-sm animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Delete Message?</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleDelete('me')}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Delete for me
                            </button>
                            <button
                                onClick={() => handleDelete('everyone')}
                                className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Delete for everyone
                            </button>
                            <button
                                onClick={() => setDeletingMessageId(null)}
                                className="w-full p-3 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            {otherParticipant?.avatarUrl ? (
                                <img src={otherParticipant.avatarUrl} alt={otherParticipant.name} className="h-full w-full object-cover" />
                            ) : (
                                otherParticipant?.name?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{otherParticipant?.name || 'Chat'}</h3>
                            <p className="text-xs text-green-500 font-medium">{otherParticipant?.isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleStartCall}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Video className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id;
                    return (
                        <div
                            key={msg._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            onDoubleClick={() => handleMessagePress(msg._id, isMe && msg.type !== 'system')}
                            onMouseDown={() => handleMouseDown(msg._id, isMe && msg.type !== 'system')}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={() => handleMouseDown(msg._id, isMe && msg.type !== 'system')}
                            onTouchEnd={handleMouseUp}
                        >
                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${isMe
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                                    } ${msg.type === 'system' ? 'italic text-slate-500 bg-transparent shadow-none' : ''}`}
                            >
                                {msg.type === 'image' && msg.mediaUrl ? (
                                    <img
                                        src={`http://localhost:5000${msg.mediaUrl}`}
                                        alt="Shared"
                                        className="rounded-lg mb-2 max-w-full"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                )}
                                <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="relative" ref={emojiPickerRef}>
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-500'}`}
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl animate-fade-in">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.AUTO}
                                    width={300}
                                    height={400}
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        )}
                    </div>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-0 bg-slate-100 dark:bg-slate-800 focus-visible:ring-0 rounded-full px-4"
                    />
                    <Button type="submit" size="sm" className="rounded-full h-10 w-10 p-0 flex items-center justify-center" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatScreen;
