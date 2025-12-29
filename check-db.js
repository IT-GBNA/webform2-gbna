const mongoose = require('mongoose');

async function checkDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/webform-gbna');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('\n📋 Collections in database:');
        collections.forEach(col => console.log(`  - ${col.name}`));

        // Check each collection
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`\n📊 Collection "${col.name}": ${count} documents`);

            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log('Sample document:', JSON.stringify(sample, null, 2));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDB();
