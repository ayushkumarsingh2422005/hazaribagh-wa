import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPoliceStation extends Document {
    name: string;
    nameHindi: string;
    address: string;
    addressHindi: string;
    district: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    governmentNumber: string;
    personalNumber?: string;
    /** @deprecated Use governmentNumber — kept for documents not yet migrated */
    contactNumber?: string;
    inchargeName?: string;
    inchargeNameHindi?: string;
    displayOrder: number;
    /** When false, station is hidden from chatbot "associated PS" list only (disclaimer, GPS, alerts unchanged). */
    showInAssociatedPsList: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PoliceStationSchema = new Schema<IPoliceStation>(
    {
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
            required: true,
        },
        addressHindi: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
            default: 'Hazaribagh',
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
        governmentNumber: {
            type: String,
            trim: true,
            default: '',
        },
        personalNumber: {
            type: String,
            trim: true,
            default: '',
        },
        contactNumber: {
            type: String,
            trim: true,
        },
        inchargeName: String,
        inchargeNameHindi: String,
        displayOrder: {
            type: Number,
            default: 0,
            min: 0,
        },
        showInAssociatedPsList: {
            type: Boolean,
            default: true,
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

// Create 2dsphere index for location-based queries
PoliceStationSchema.index({ location: '2dsphere' });

const PoliceStation: Model<IPoliceStation> =
    mongoose.models.PoliceStation || mongoose.model<IPoliceStation>('PoliceStation', PoliceStationSchema);

export default PoliceStation;
