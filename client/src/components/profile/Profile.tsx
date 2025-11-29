import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Clock, Moon, Sun, Phone, Edit2, Camera, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { userApi, chatApi } from '../../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, setUser } = useAuthStore();
    const { isDark, toggle } = useThemeStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        password: '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const startEditing = () => {
        if (user) {
            setFormData({
                name: user.name,
                password: '',
            });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updateData: any = {};
            if (formData.name !== user?.name) updateData.name = formData.name;
            if (formData.password) updateData.password = formData.password;

            const { data } = await userApi.updateProfile(updateData);
            setUser({ ...user, ...data }); // Update local store
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('image', file);

            try {
                setLoading(true);
                // 1. Upload image
                const { data: uploadData } = await chatApi.uploadImage(formData);

                // 2. Update profile with new avatar URL (full URL)
                const fullAvatarUrl = `http://localhost:5000${uploadData.url}`;
                const { data: userData } = await userApi.updateProfile({ avatarUrl: fullAvatarUrl });

                setUser({ ...user, ...userData });
            } catch (error) {
                console.error('Failed to update avatar', error);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!user) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggle}
                        className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
                    </button>
                </div>
            </header>

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 space-y-6 relative">
                {/* Edit Button */}
                {!isEditing && (
                    <button
                        onClick={startEditing}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                )}

                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                user.name[0].toUpperCase()
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Camera className="w-8 h-8 text-white" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-4 border-white dark:border-slate-800" />
                    </div>
                    <div className="text-center w-full">
                        {isEditing ? (
                            <div className="space-y-3 max-w-xs mx-auto">
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Your Name"
                                    className="text-center"
                                />
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="New Password (optional)"
                                    className="text-center"
                                />
                                <div className="flex space-x-2 justify-center pt-2">
                                    <Button size="sm" onClick={handleSave} disabled={loading}>
                                        <Save className="w-4 h-4 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* User Info */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <Mail className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {user.phone.countryCode} {user.phone.number}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full mt-6 rounded-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
            </div>

            {/* App Info */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4">
                <p>Sparkle Messaging App</p>
                <p className="text-xs mt-1">Version 1.0.0</p>
            </div>
        </div>
    );
};

export default Profile;
