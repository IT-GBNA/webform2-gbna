/**
 * Script de migration pour ajouter moduleId aux anciens scores
 * Usage: npx tsx scripts/migrate-scores.ts
 */

import mongoose from 'mongoose';

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/webform-gbna';

// Mapping des anciens scores vers les nouvelles formations
// Ajustez ce mapping selon vos besoins
const MIGRATION_RULES = [
    {
        // Tous les scores sans moduleId seront assignés à cette formation
        condition: { moduleId: { $exists: false } },
        newModuleId: 'form_1' // Changer selon l'ID de votre formation de cybersécurité
    },
    {
        // Ou si moduleId est null
        condition: { moduleId: null },
        newModuleId: 'form_1'
    },
    {
        // Ou si moduleId est une chaîne vide
        condition: { moduleId: '' },
        newModuleId: 'form_1'
    }
];

async function migrate() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Base de données non disponible');
        }

        const scoresCollection = db.collection('scores');

        // Compter les scores à migrer
        const countWithoutModule = await scoresCollection.countDocuments({
            $or: [
                { moduleId: { $exists: false } },
                { moduleId: null },
                { moduleId: '' }
            ]
        });

        console.log(`📊 ${countWithoutModule} scores sans moduleId trouvés`);

        if (countWithoutModule === 0) {
            console.log('✅ Aucune migration nécessaire');
            await mongoose.disconnect();
            return;
        }

        // Appliquer les migrations
        for (const rule of MIGRATION_RULES) {
            const result = await scoresCollection.updateMany(
                rule.condition,
                { $set: { moduleId: rule.newModuleId } }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ ${result.modifiedCount} scores migrés vers moduleId: ${rule.newModuleId}`);
            }
        }

        // Vérification finale
        const countAfter = await scoresCollection.countDocuments({
            $or: [
                { moduleId: { $exists: false } },
                { moduleId: null },
                { moduleId: '' }
            ]
        });

        console.log(`📊 ${countAfter} scores restants sans moduleId`);
        console.log('✅ Migration terminée !');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

migrate();
