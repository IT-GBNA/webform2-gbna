import User from "../../models/User";

export default defineEventHandler(async (event) => {
    // Vérifier l'authentification
    if (!event.context.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Non autorisé'
        });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID utilisateur requis'
        });
    }

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Utilisateur non trouvé'
            });
        }

        return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error: any) {
        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la suppression de l\'utilisateur'
        });
    }
});
