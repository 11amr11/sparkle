import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
        })
            .populate('participants', 'name avatarUrl isOnline lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({
            conversationId,
            deletedFor: { $ne: req.user.id } // Exclude messages deleted for this user
        })
            .sort({ createdAt: 1 });

        // Mask content if deleted for everyone
        const sanitizedMessages = messages.map(msg => {
            if (msg.isDeletedForEveryone) {
                return {
                    ...msg.toObject(),
                    content: 'This message was deleted',
                    type: 'system', // Or keep original type but show deleted UI
                    mediaUrl: null
                };
            }
            return msg;
        });

        res.json(sanitizedMessages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { type } = req.query; // 'me' or 'everyone'

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (type === 'everyone') {
            if (message.senderId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete for everyone' });
            }
            message.isDeletedForEveryone = true;
            await message.save();
            // Ideally emit socket event to update UI for everyone
        } else {
            // Delete for me
            if (!message.deletedFor.includes(req.user.id)) {
                message.deletedFor.push(req.user.id);
                await message.save();
            }
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const startConversation = async (req: AuthRequest, res: Response) => {
    const { participantId } = req.body;

    try {
        // Check if DM exists
        let conversation = await Conversation.findOne({
            type: 'dm',
            participants: { $all: [req.user.id, participantId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user.id, participantId],
                type: 'dm',
            });
        }

        const fullConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name avatarUrl isOnline lastSeen');

        res.json(fullConversation);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
