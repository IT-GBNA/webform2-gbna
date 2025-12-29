import mongoose, { Schema, Document } from "mongoose";

export interface ProcedureDocument extends Document {
    id: string;
    title: string;
    description: string;
    category: string;
    fileUrl?: string;
    order: number;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProcedureSchema = new Schema<ProcedureDocument>({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        default: 'general',
    },
    fileUrl: {
        type: String,
        required: false,
    },
    order: {
        type: Number,
        default: 0,
    },
    published: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Procedure || mongoose.model<ProcedureDocument>("Procedure", ProcedureSchema);
