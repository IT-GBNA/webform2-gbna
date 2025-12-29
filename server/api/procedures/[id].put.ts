import Procedure from "../../models/Procedure";

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Non autorisé" });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: "ID requis" });
    }

    try {
        const body = await readBody(event);
        const updateData: any = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
        if (body.order !== undefined) updateData.order = body.order;
        if (body.published !== undefined) updateData.published = body.published;

        const procedure = await Procedure.findOneAndUpdate(
            { id },
            updateData,
            { new: true }
        );

        if (!procedure) {
            throw createError({ statusCode: 404, statusMessage: "Procédure non trouvée" });
        }

        return procedure;
    } catch (error: any) {
        console.error("❌ Erreur mise à jour procédure:", error);
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la mise à jour"
        });
    }
});
