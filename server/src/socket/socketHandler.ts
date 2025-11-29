import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

interface AuthSocket extends Socket {
    user?: any;
}

export const setupSocket = (io: Server) => {
    io.use(async (socket: AuthSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            socket.user = decoded;

            // Update user status to online
            await User.findByIdAndUpdate(socket.user.id, { isOnline: true, lastSeen: new Date() });

            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket: AuthSocket) => {
        console.log(`User connected: ${socket.user.id}`);

        // Join user's own room for personal notifications
        socket.join(socket.user.id);

        // Broadcast online status
        socket.broadcast.emit('presence:update', { userId: socket.user.id, status: 'online' });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user.id}`);
            // Update user status to offline
            await User.findByIdAndUpdate(socket.user.id, { isOnline: false, lastSeen: new Date() });
            socket.broadcast.emit('presence:update', { userId: socket.user.id, status: 'offline' });
        });

        // Join conversation room
        socket.on('join:conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            const { conversationId, content, type, tempId } = data;

            try {
                const message = await Message.create({
                    conversationId,
                    senderId: socket.user.id,
                    content,
                    type: type || 'text',
                    readBy: [socket.user.id]
                });

                const fullMessage = await message.populate('senderId', 'name avatarUrl');

                // Update conversation lastMessage
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: message._id,
                    updatedAt: new Date()
                });

                // Emit to everyone in conversation
                io.to(conversationId).emit('message:received', fullMessage);

                // Ack to sender
                socket.emit('message:ack', { tempId, messageId: message._id });

            } catch (error) {
                console.error('Message send error:', error);
                socket.emit('message:error', { tempId, error: 'Failed to send' });
            }
        });

        // Typing indicators
        socket.on('typing:start', (conversationId) => {
            socket.to(conversationId).emit('typing:start', { userId: socket.user.id, conversationId });
        });

        socket.on('typing:stop', (conversationId) => {
            socket.to(conversationId).emit('typing:stop', { userId: socket.user.id, conversationId });
        });

        // WebRTC Signaling
        socket.on('call:offer', (data) => {
            const { toUserId, sdp } = data;
            io.to(toUserId).emit('call:offer', { fromUserId: socket.user.id, sdp });
        });

        socket.on('call:answer', (data) => {
            const { toUserId, sdp } = data;
            io.to(toUserId).emit('call:answer', { fromUserId: socket.user.id, sdp });
        });

        socket.on('call:candidate', (data) => {
            const { toUserId, candidate } = data;
            io.to(toUserId).emit('call:candidate', { fromUserId: socket.user.id, candidate });
        });

        socket.on('call:end', (data) => {
            const { toUserId } = data;
            console.log(`[Server] call:end from ${socket.user.id} to ${toUserId}`);
            io.to(toUserId).emit('call:end', { fromUserId: socket.user.id });
        });

        socket.on('call:declined', (data) => {
            const { toUserId } = data;
            console.log(`[Server] call:declined from ${socket.user.id} to ${toUserId}`);
            io.to(toUserId).emit('call:declined', { fromUserId: socket.user.id });
        });
    });
};
