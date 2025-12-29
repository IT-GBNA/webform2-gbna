import Formation from "../models/Formation";
import { AVAILABLE_MODULES } from "../config/modules.config";

export default defineNitroPlugin(async (nitroApp) => {
    console.log("🔄 Vérification des formations en base de données...");

    try {
        // Wait a bit for MongoDB connection to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if formations already exist in DB
        const existingCount = await Formation.countDocuments();

        if (existingCount === 0) {
            console.log("📦 Aucune formation trouvée, migration en cours...");

            // Migrate formations from config to MongoDB
            for (const module of AVAILABLE_MODULES) {
                await Formation.create({
                    id: module.id,
                    displayName: module.displayName,
                    description: module.description,
                    collectionName: module.collectionName,
                    duration: module.duration,
                    route: module.route,
                    order: module.order,
                    videoUrl: module.videoUrl
                });
            }

            console.log(`✅ ${AVAILABLE_MODULES.length} formations migrées avec succès !`);
        } else {
            console.log(`✅ ${existingCount} formations déjà présentes en base de données.`);
        }
    } catch (error) {
        console.error("❌ Erreur lors de la migration des formations:", error);
    }
});
