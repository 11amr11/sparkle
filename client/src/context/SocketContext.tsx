import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = 'http://localhost:5000';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { token } = useAuthStore();

    useEffect(() => {
        if (token && !socketRef.current) {
            console.log('[SocketProvider] Creating socket connection');
            const newSocket = io(SOCKET_URL, {
                auth: { token },
            });

            newSocket.on('connect', () => {
                console.log('[SocketProvider] Socket connected');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('[SocketProvider] Socket disconnected');
                setIsConnected(false);
            });

            socketRef.current = newSocket;
        }

        return () => {
            if (!token && socketRef.current) {
                console.log('[SocketProvider] Cleaning up socket');
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    return context.socket;
};
