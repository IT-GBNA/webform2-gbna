import User from "../../../models/User";
import crypto from "node:crypto";

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
        // Générer une nouvelle clé API (32 caractères hex = 16 bytes)
        const apiKey = `gbna_${crypto.randomBytes(24).toString('hex')}`;

        const user = await User.findByIdAndUpdate(
            id,
            { apiKey },
            { new: true }
        ).select('-password');

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Utilisateur non trouvé'
            });
        }

        return {
            success: true,
            apiKey: user.apiKey,
            message: 'Clé API générée avec succès'
        };
    } catch (error: any) {
        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la génération de la clé API'
        });
    }
});
