import mongoose, { Schema, Model, Document } from 'mongoose';

export type PoliceOfficeCategory = 'dsp' | 'ci';

export interface IPoliceOffice extends Document {
    /** Stable key for WhatsApp list id: office_{officeKey} */
    officeKey: string;
    category: PoliceOfficeCategory;
    name: string;
    nameHindi: string;
    address: string;
    addressHindi: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    phone?: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PoliceOfficeSchema = new Schema<IPoliceOffice>(
    {
        officeKey: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        category: {
            type: String,
            enum: ['dsp', 'ci'],
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        nameHindi: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            default: '',
        },
        addressHindi: {
            type: String,
            default: '',
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        displayOrder: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

PoliceOfficeSchema.index({ category: 1, displayOrder: 1, name: 1 });

const PoliceOffice: Model<IPoliceOffice> =
    mongoose.models.PoliceOffice || mongoose.model<IPoliceOffice>('PoliceOffice', PoliceOfficeSchema);

export default PoliceOffice;
