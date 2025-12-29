import Formation from "../../models/Formation";
import { logger } from "../../utils/logger";

export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID formation requis'
        });
    }

    try {
        const formation = await Formation.findOneAndDelete({ id: id });

        if (!formation) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Formation non trouvée'
            });
        }

        // Log the deletion
        await logger.userAction(
            'FORMATION_DELETE',
            `Formation "${formation.displayName}" (${id}) supprimée`,
            event.context.user.id,
            event.context.user.email || event.context.user.username,
            { formationId: id, formationName: formation.displayName }
        );

        // Reorder remaining formations
        const remainingFormations = await Formation.find({}).sort({ order: 1 });
        for (let i = 0; i < remainingFormations.length; i++) {
            await Formation.findByIdAndUpdate(remainingFormations[i]._id, { order: i + 1 });
        }

        return {
            success: true,
            message: "Formation supprimée avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de la suppression de la formation:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la suppression de la formation",
        });
    }
});
