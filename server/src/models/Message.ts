import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'file' | 'system';
    content?: string;
    mediaUrl?: string;
    readBy: mongoose.Types.ObjectId[];
    deletedFor: mongoose.Types.ObjectId[];
    isDeletedForEveryone: boolean;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    content: { type: String },
    mediaUrl: { type: String },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeletedForEveryone: { type: Boolean, default: false },
}, {
    timestamps: true,
});

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
