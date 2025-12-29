import User from "../../models/User";

export default defineEventHandler(async (event) => {
    // Vérifier l'authentification
    if (!event.context.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Non autorisé'
        });
    }

    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        return users;
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la récupération des utilisateurs'
        });
    }
});
