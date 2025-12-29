import mongoose, { Schema, Document } from "mongoose";

export interface ExportLogDocument extends Document {
    formationId: string;
    formationName: string;
    recipientCount: number;
    recipients: string[];
    triggeredBy: 'manual' | 'scheduler';
    userId?: string;
    username?: string;
    success: boolean;
    errorMessage?: string;
    createdAt: Date;
}

const ExportLogSchema = new Schema<ExportLogDocument>({
    formationId: {
        type: String,
        required: true,
        index: true,
    },
    formationName: {
        type: String,
        required: true,
    },
    recipientCount: {
        type: Number,
        default: 0,
    },
    recipients: [{
        type: String,
    }],
    triggeredBy: {
        type: String,
        enum: ['manual', 'scheduler'],
        required: true,
    },
    userId: {
        type: String,
    },
    username: {
        type: String,
    },
    success: {
        type: Boolean,
        required: true,
    },
    errorMessage: {
        type: String,
    },
}, {
    timestamps: true,
});

// Index pour le rate limiting (recherche par formationId et date)
ExportLogSchema.index({ formationId: 1, createdAt: -1 });

export default mongoose.models.ExportLog || mongoose.model<ExportLogDocument>("ExportLog", ExportLogSchema);
