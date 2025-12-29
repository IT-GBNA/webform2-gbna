import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
    email: string;
    username: string;
    password: string;
    role: string;
    apiKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"],
    },

    role: {
        type: String,
        enum: ['superadmin', 'admin', 'export'],
        default: 'admin',
    },

    apiKey: {
        type: String,
        unique: true,
        sparse: true,
    },
}, {
    timestamps: true,
});

// Important : éviter OverwriteModelError sous Nitro !
export default mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

