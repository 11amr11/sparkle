import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { token } = useAuthStore();

    useEffect(() => {
        if (token && !socketRef.current) {
            console.log('[useSocket] Creating new socket connection');
            const newSocket = io(SOCKET_URL, {
                auth: { token },
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socketRef.current = newSocket;
        }

        // Cleanup only on unmount
        return () => {
            if (!token && socketRef.current) {
                console.log('[useSocket] Disconnecting socket (token removed)');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [token]);

    return socketRef.current;
};
