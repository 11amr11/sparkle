import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const register = async (req: Request, res: Response) => {
    const { name, username, email, phone, password } = req.body;

    try {
        // Check if user already exists (email, username, or phone)
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
                { 'phone.countryCode': phone?.countryCode, 'phone.number': phone?.number }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
        });

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.status(201).json({
            _id: user._id as unknown as string,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { identifier, password } = req.body; // identifier can be email or username

    try {
        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier },
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.json({
            _id: user._id as unknown as string,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
