import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: {
        countryCode: { type: String, required: true },
        number: { type: String, required: true }
    },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    password: { type: String, required: true },
    avatarUrl: String,
    isOnline: { type: Boolean, default: false },
    lastSeen: Date,
}, { timestamps: true });

// Create compound unique index for phone
UserSchema.index({ 'phone.countryCode': 1, 'phone.number': 1 }, { unique: true });

export default mongoose.model('User', UserSchema);
