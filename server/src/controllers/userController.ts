import { Request, Response } from 'express';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const getContacts = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.id).populate('contacts', 'name username email phone avatarUrl isOnline lastSeen');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.contacts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const addContact = async (req: AuthRequest, res: Response) => {
    const { identifier } = req.body; // username or phone number

    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find user to add
        const userToAdd = await User.findOne({
            $or: [
                { username: identifier },
                { 'phone.number': identifier }, // Simple check, might need country code handling if strict
                { email: identifier }
            ]
        });

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToAdd._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: 'Cannot add yourself' });
        }

        // Check if already in contacts
        if (currentUser.contacts.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User already in contacts' });
        }

        currentUser.contacts.push(userToAdd._id);
        await currentUser.save();

        const populatedUser = await userToAdd.populate('contacts'); // Just to return something valid or return the userToAdd

        res.json({ message: 'Contact added successfully', contact: userToAdd });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({})
            .select('name username email phone avatarUrl isOnline lastSeen')
            .sort({ name: 1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name username email phone avatarUrl isOnline lastSeen');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { name, avatarUrl, password } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            token: req.headers.authorization?.split(' ')[1] // Return same token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
