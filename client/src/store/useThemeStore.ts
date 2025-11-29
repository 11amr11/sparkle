import { create } from 'zustand';
import { useEffect } from 'react';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
    setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    isDark: localStorage.getItem('theme') === 'dark',
    toggle: () => set((state) => {
        const newIsDark = !state.isDark;
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        if (newIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { isDark: newIsDark };
    }),
    setTheme: (isDark) => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ isDark });
    },
}));

// Hook to initialize theme on app load
export const useInitTheme = () => {
    const isDark = useThemeStore((state) => state.isDark);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);
};
