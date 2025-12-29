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
        const body = await readBody(event);

        // Construire l'objet de mise à jour
        const updateData: any = {};

        // Champs classiques (seulement s'ils sont présents)
        if (body.displayName !== undefined) updateData.displayName = body.displayName;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.duration !== undefined) updateData.duration = body.duration;
        if (body.route !== undefined) updateData.route = body.route;
        if (body.collectionName !== undefined) updateData.collectionName = body.collectionName;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
        if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;

        // Champs d'export (legacy)
        if (body.exportEnabled !== undefined) updateData.exportEnabled = body.exportEnabled;
        if (body.exportRecipients !== undefined) updateData.exportRecipients = body.exportRecipients;
        if (body.exportApiKey !== undefined) updateData.exportApiKey = body.exportApiKey;
        if (body.exportDay !== undefined) updateData.exportDay = body.exportDay;
        if (body.exportHour !== undefined) updateData.exportHour = body.exportHour;
        if (body.exportMinute !== undefined) updateData.exportMinute = body.exportMinute;
        if (body.exportInstitution !== undefined) updateData.exportInstitution = body.exportInstitution;

        // Nouveau: tableau de configurations d'export
        if (body.exportConfigs !== undefined) updateData.exportConfigs = body.exportConfigs;

        console.log('📝 Mise à jour formation:', id, updateData);

        // Find and update the formation
        const formation = await Formation.findOneAndUpdate(
            { id: id },
            updateData,
            { new: true }
        );

        if (!formation) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Formation non trouvée'
            });
        }

        // Log the update
        await logger.userAction(
            'FORMATION_UPDATE',
            `Formation "${formation.displayName}" mise à jour`,
            event.context.user.id,
            event.context.user.email || event.context.user.username,
            { formationId: id, formationName: formation.displayName }
        );

        return {
            success: true,
            formation: formation,
            message: "Formation mise à jour avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de la mise à jour de la formation:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la mise à jour de la formation",
        });
    }
});
