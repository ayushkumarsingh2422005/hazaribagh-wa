import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IChatbotFlowSession {
    step: string;
    data?: Record<string, unknown>;
}

export interface IContact extends Document {
    phoneNumber: string;
    name?: string;
    language?: 'english' | 'hindi';
    /** Persisted chatbot step so location/photo handlers work across serverless requests. */
    flowSession?: IChatbotFlowSession;
    lastMessageAt: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
    {
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            trim: true,
        },
        language: {
            type: String,
            enum: ['english', 'hindi'],
        },
        flowSession: {
            step: { type: String },
            data: { type: Schema.Types.Mixed },
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        unreadCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
