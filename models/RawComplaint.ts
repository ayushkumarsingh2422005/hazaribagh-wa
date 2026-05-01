import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRawComplaint extends Document {
    rawComplaintId: string;
    phoneNumber: string;
    /** Full message as sent by the user (wrong format / could not parse into fields). */
    rawText: string;
    /** Chat flow step when submitted (e.g. sub_passport_delay, suggestion_form). */
    flowStep: string;
    status: 'pending' | 'in_progress' | 'resolved';
    assignedTo?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RawComplaintSchema = new Schema<IRawComplaint>(
    {
        rawComplaintId: {
            type: String,
            unique: true,
            sparse: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        rawText: {
            type: String,
            required: true,
        },
        flowStep: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'resolved'],
            default: 'pending',
        },
        assignedTo: String,
        resolvedAt: Date,
    },
    {
        timestamps: true,
    }
);

RawComplaintSchema.pre('save', async function () {
    if (this.isNew && !this.rawComplaintId) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('RawComplaint').countDocuments({});
        const serial = String(count + 1).padStart(5, '0');
        this.rawComplaintId = `HZB-RAW-${year}-${serial}`;
    }
});

RawComplaintSchema.index({ phoneNumber: 1, createdAt: -1 });
RawComplaintSchema.index({ status: 1, createdAt: -1 });
RawComplaintSchema.index({ flowStep: 1, createdAt: -1 });

const RawComplaint: Model<IRawComplaint> =
    mongoose.models.RawComplaint ||
    mongoose.model<IRawComplaint>('RawComplaint', RawComplaintSchema);

export default RawComplaint;
