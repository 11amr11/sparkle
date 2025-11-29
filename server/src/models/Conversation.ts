import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
    type: 'dm' | 'group';
    groupName?: string;
    groupAvatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    type: { type: String, enum: ['dm', 'group'], default: 'dm' },
    groupName: { type: String },
    groupAvatar: { type: String },
}, {
    timestamps: true,
});

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;
