import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, UserPlus, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { userApi, chatApi } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    phone: {
        countryCode: string;
        number: string;
    };
    avatarUrl?: string;
    isOnline?: boolean;
}

const Contacts = () => {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addIdentifier, setAddIdentifier] = useState('');
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const { data } = await userApi.getContacts();
            setContacts(data);
        } catch (error) {
            console.error('Failed to fetch contacts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAddSuccess('');

        if (!addIdentifier.trim()) return;

        try {
            const { data } = await userApi.addContact(addIdentifier);
            setAddSuccess('Contact added successfully!');
            setAddIdentifier('');
            fetchContacts(); // Refresh list
            setTimeout(() => {
                setIsModalOpen(false);
                setAddSuccess('');
            }, 1500);
        } catch (error: any) {
            setAddError(error.response?.data?.message || 'Failed to add contact');
        }
    };

    const startConversation = async (userId: string) => {
        try {
            const { data } = await chatApi.startConversation(userId);
            navigate(`/chat/${data._id}`);
        } catch (error) {
            console.error('Failed to start conversation', error);
        }
    };

    const filteredContacts = contacts.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.phone?.countryCode}${user.phone?.number}`.includes(searchQuery.replace(/\s/g, ''))
    );

    return (
        <div className="p-4 space-y-4 pb-20">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contacts</h1>
                    <Button onClick={() => setIsModalOpen(true)} size="sm" className="rounded-full">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search your contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </header>

            {loading ? (
                <div className="text-center py-8 text-slate-500">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <div className="flex justify-center mb-4">
                        <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">No contacts yet</p>
                    <p className="text-sm">Add friends by their username or phone number to start chatting!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredContacts.map((user) => (
                        <div
                            key={user._id}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            user.name[0].toUpperCase()
                                        )}
                                    </div>
                                    {user.isOnline && (
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-950" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => startConversation(user._id)}
                                className="rounded-full"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Contact Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Contact</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAddContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Username or Phone Number
                                </label>
                                <Input
                                    value={addIdentifier}
                                    onChange={(e) => setAddIdentifier(e.target.value)}
                                    placeholder="e.g. username123 or 1234567890"
                                    className="w-full"
                                    autoFocus
                                />
                            </div>

                            {addError && <p className="text-sm text-red-500">{addError}</p>}
                            {addSuccess && <p className="text-sm text-green-500">{addSuccess}</p>}

                            <Button type="submit" className="w-full rounded-xl" disabled={!addIdentifier.trim()}>
                                Add Contact
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
