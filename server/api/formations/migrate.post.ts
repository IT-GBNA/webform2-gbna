import Formation from "../../models/Formation";
import { AVAILABLE_MODULES } from "../../config/modules.config";

export default defineEventHandler(async (event) => {
    // Only allow in development or with special auth
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        // Check if formations already exist in DB
        const existingCount = await Formation.countDocuments();

        if (existingCount > 0) {
            return {
                success: false,
                message: `${existingCount} formations déjà présentes en base de données. Migration ignorée.`,
                existingCount
            };
        }

        // Migrate formations from config to MongoDB
        const migratedFormations = [];

        for (const module of AVAILABLE_MODULES) {
            const formation = await Formation.create({
                id: module.id,
                displayName: module.displayName,
                description: module.description,
                collectionName: module.collectionName,
                duration: module.duration,
                route: module.route,
                order: module.order,
                videoUrl: module.videoUrl
            });
            migratedFormations.push(formation);
        }

        return {
            success: true,
            message: `${migratedFormations.length} formations migrées avec succès`,
            formations: migratedFormations
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de la migration:", error);

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la migration"
        });
    }
});
