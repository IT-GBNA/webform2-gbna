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
        const procedure = await Procedure.findOneAndDelete({ id });

        if (!procedure) {
            throw createError({ statusCode: 404, statusMessage: "Procédure non trouvée" });
        }

        return { success: true, message: "Procédure supprimée" };
    } catch (error: any) {
        console.error("❌ Erreur suppression procédure:", error);
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la suppression"
        });
    }
});
