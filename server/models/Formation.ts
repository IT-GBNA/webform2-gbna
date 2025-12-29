import mongoose, { Schema, Document } from "mongoose";

// Interface pour une configuration d'export individuelle
export interface ExportConfig {
    _id?: string;
    enabled: boolean;
    recipients: string[];
    apiKey?: string;
    day: number; // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
    hour: number; // 0-23
    minute: number; // 0-59
    institution?: string; // Filtre par établissement (null = tous)
}

export interface FormationDocument extends Document {
    id: string;
    displayName: string;
    description: string;
    collectionName: string;
    duration: string;
    route: string;
    order: number;
    videoUrl?: string;
    coverImage?: string;
    // Export automatique - tableau de configurations
    exportConfigs: ExportConfig[];
    // Legacy fields (pour compatibilité)
    exportEnabled?: boolean;
    exportRecipients?: string[];
    exportApiKey?: string;
    exportDay?: number;
    exportHour?: number;
    exportMinute?: number;
    exportInstitution?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Schema pour une configuration d'export
const ExportConfigSchema = new Schema({
    enabled: {
        type: Boolean,
        default: true,
    },
    recipients: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    apiKey: {
        type: String,
    },
    day: {
        type: Number,
        default: 1,
        min: 0,
        max: 6,
    },
    hour: {
        type: Number,
        default: 8,
        min: 0,
        max: 23,
    },
    minute: {
        type: Number,
        default: 0,
        min: 0,
        max: 59,
    },
    institution: {
        type: String,
        default: null,
    },
}, { _id: true });

const FormationSchema = new Schema<FormationDocument>({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    collectionName: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    route: {
        type: String,
        required: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    videoUrl: {
        type: String,
        required: false,
    },
    coverImage: {
        type: String,
        required: false,
    },
    // Nouveau: tableau de configurations d'export
    exportConfigs: {
        type: [ExportConfigSchema],
        default: [],
    },
    // Legacy fields pour compatibilité descendante
    exportEnabled: {
        type: Boolean,
        default: false,
    },
    exportRecipients: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    exportApiKey: {
        type: String,
    },
    exportDay: {
        type: Number,
        default: 1,
        min: 0,
        max: 6,
    },
    exportHour: {
        type: Number,
        default: 8,
        min: 0,
        max: 23,
    },
    exportMinute: {
        type: Number,
        default: 0,
        min: 0,
        max: 59,
    },
    exportInstitution: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

// Important : éviter OverwriteModelError sous Nitro !
export default mongoose.models.Formation || mongoose.model<FormationDocument>("Formation", FormationSchema);
