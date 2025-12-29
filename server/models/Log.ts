import mongoose, { Document, Model } from 'mongoose';

export interface ILog extends Document {
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'debug';
    action: string;
    message: string;
    userId?: string;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

const LogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        default: 'info',
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        index: true
    },
    userEmail: {
        type: String
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: false
});

// Index pour les requêtes fréquentes
LogSchema.index({ timestamp: -1, level: 1 });
LogSchema.index({ action: 1, timestamp: -1 });

// TTL index - supprimer les logs après 90 jours
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

let Log: Model<ILog>;

try {
    Log = mongoose.model<ILog>('Log');
} catch {
    Log = mongoose.model<ILog>('Log', LogSchema);
}

export default Log;
