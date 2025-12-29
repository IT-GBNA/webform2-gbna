import Formation from "../../models/Formation";

export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const body = await readBody(event);

        if (!body.ids || !Array.isArray(body.ids)) {
            throw createError({
                statusCode: 400,
                statusMessage: "Liste d'IDs invalide",
            });
        }

        // Update order for each formation
        for (let i = 0; i < body.ids.length; i++) {
            await Formation.findOneAndUpdate(
                { id: body.ids[i] },
                { order: i + 1 }
            );
        }

        return {
            success: true,
            message: "Ordre des formations mis à jour avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de la réorganisation des formations:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la réorganisation des formations",
        });
    }
});
