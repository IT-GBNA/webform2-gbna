import mongoose from 'mongoose';

export default defineNitroPlugin(async (nitroApp) => {
    // Fallback to a default local URI if MONGODB_URI is not set
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webform-gbna';

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        if (mongoose.connection.db) {
            console.log('📊 Database:', mongoose.connection.db.databaseName);
        }
        console.log('🔗 Connection URI:', MONGODB_URI);
    } catch (e) {
        console.error('❌ Error connecting to MongoDB:', e);
    }
});
