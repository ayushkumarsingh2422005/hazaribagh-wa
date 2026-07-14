import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type OtpPurpose = 'app' | 'admin_reset';

export interface IAppOtp extends Document {
    phoneNumber: string;
    purpose: OtpPurpose;
    userId?: Types.ObjectId;
    otp: string;
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
}

const AppOtpSchema = new Schema<IAppOtp>(
    {
        phoneNumber: { type: String, required: true, trim: true },
        purpose: { type: String, enum: ['app', 'admin_reset'], default: 'app', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        otp: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: true },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

AppOtpSchema.index({ phoneNumber: 1, purpose: 1 }, { unique: true });

const AppOtp: Model<IAppOtp> =
    mongoose.models.AppOtp || mongoose.model<IAppOtp>('AppOtp', AppOtpSchema);

export default AppOtp;
