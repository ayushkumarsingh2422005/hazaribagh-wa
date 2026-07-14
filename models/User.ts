import mongoose, { Schema, Model, Document } from 'mongoose';
import type { AdminPermissions } from '@/lib/admin-permissions';
import { emptyPermissions } from '@/lib/admin-permissions';

export interface IUser extends Document {
    username: string;
    email: string;
    /** Optional contact mobile (10 digits) */
    phoneNumber?: string;
    password?: string;
    /** Full authority — bypasses all permission & PS checks */
    isSuperAdmin: boolean;
    /** Can create / edit other admin accounts */
    canManageAdmins: boolean;
    /** Can access WhatsApp chat module */
    canAccessChats: boolean;
    /** Per-section dashboard access */
    permissions: AdminPermissions;
    /** Empty = all police stations; non-empty = scoped to these station names */
    policeStationNames: string[];
    /** Empty = all chatbot services; non-empty = scoped complaint types only */
    allowedComplaintTypes: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PermissionsSchema = new Schema(
    {
        dashboard: { type: Boolean, default: false },
        chats: { type: Boolean, default: false },
        test_whatsapp: { type: Boolean, default: false },
        police_stations: { type: Boolean, default: false },
        police_offices: { type: Boolean, default: false },
        traffic_rules: { type: Boolean, default: false },
        complaints: { type: Boolean, default: false },
        raw_complaints: { type: Boolean, default: false },
        reviews: { type: Boolean, default: false },
        resources: { type: Boolean, default: false },
        admin_users: { type: Boolean, default: false },
        settings: { type: Boolean, default: false },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, 'Please provide a username'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
            default: '',
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            select: false,
        },
        isSuperAdmin: { type: Boolean, default: false },
        canManageAdmins: { type: Boolean, default: false },
        canAccessChats: { type: Boolean, default: false },
        permissions: {
            type: PermissionsSchema,
            default: () => emptyPermissions(),
        },
        policeStationNames: {
            type: [String],
            default: [],
        },
        allowedComplaintTypes: {
            type: [String],
            default: [],
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
