import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAppOtp extends Document {
    phoneNumber: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
}

const AppOtpSchema = new Schema<IAppOtp>(
    {
        phoneNumber: { type: String, required: true, trim: true, index: true },
        otp: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: true },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

AppOtpSchema.index({ phoneNumber: 1 }, { unique: true });

const AppOtp: Model<IAppOtp> =
    mongoose.models.AppOtp || mongoose.model<IAppOtp>('AppOtp', AppOtpSchema);

export default AppOtp;
