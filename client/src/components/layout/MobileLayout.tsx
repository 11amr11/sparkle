import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { MessageSquare, Phone, Users, User, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/useThemeStore';

const MobileLayout = () => {
    const location = useLocation();
    const { isDark, toggle } = useThemeStore();

    const navItems = [
        { icon: MessageSquare, label: 'Chats', path: '/' },
        { icon: Phone, label: 'Calls', path: '/calls' },
        { icon: Users, label: 'Contacts', path: '/contacts' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
            {/* Global Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 sticky top-0 z-10">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Sparkle
                </h1>
                <button
                    onClick={toggle}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {isDark ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-slate-600" />
                    )}
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-16">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-16 items-center justify-around">
                    {navItems.map(({ icon: Icon, label, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={cn(
                                    'flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
                                )}
                            >
                                <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default MobileLayout;
