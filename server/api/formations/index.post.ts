import Formation from "../../models/Formation";
import { logger } from "../../utils/logger";

export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const body = await readBody(event);

        // Validation
        if (!body.id || !body.displayName || !body.description || !body.duration) {
            throw createError({
                statusCode: 400,
                statusMessage: "Tous les champs obligatoires doivent être remplis",
            });
        }

        // Check if formation with this ID already exists
        const existingFormation = await Formation.findOne({ id: body.id });
        if (existingFormation) {
            throw createError({
                statusCode: 409,
                statusMessage: `Une formation avec l'ID "${body.id}" existe déjà`,
            });
        }

        // Auto-generate collectionName if not provided
        if (!body.collectionName) {
            body.collectionName = body.id;
        }

        // Auto-generate route if not provided
        if (!body.route) {
            body.route = `/formation/${body.id}`;
        }

        // Get max order
        const maxOrderFormation = await Formation.findOne({}).sort({ order: -1 });
        const nextOrder = maxOrderFormation ? maxOrderFormation.order + 1 : 1;

        // Create new formation
        const newFormation = await Formation.create({
            id: body.id,
            displayName: body.displayName,
            description: body.description,
            collectionName: body.collectionName,
            duration: body.duration,
            route: body.route,
            order: body.order || nextOrder,
            videoUrl: body.videoUrl
        });

        // Log the creation
        await logger.userAction(
            'FORMATION_CREATE',
            `Formation "${newFormation.displayName}" créée`,
            event.context.user.id,
            event.context.user.email || event.context.user.username,
            { formationId: newFormation.id, formationName: newFormation.displayName }
        );

        return {
            success: true,
            formation: newFormation,
            message: "Formation créée avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de la création de la formation:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la création de la formation",
        });
    }
});
