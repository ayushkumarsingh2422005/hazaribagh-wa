import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAppSession extends Document {
    phoneNumber: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AppSessionSchema = new Schema<IAppSession>(
    {
        phoneNumber: { type: String, required: true, trim: true, index: true },
        token: { type: String, required: true, unique: true, index: true },
        expiresAt: { type: Date, required: true, index: true },
    },
    { timestamps: true }
);

const AppSession: Model<IAppSession> =
    mongoose.models.AppSession || mongoose.model<IAppSession>('AppSession', AppSessionSchema);

export default AppSession;
