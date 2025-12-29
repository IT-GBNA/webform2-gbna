import { Score } from '../../../models/Score';

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
            statusMessage: 'ID du score requis'
        });
    }

    try {
        console.log('🗑️ Tentative de suppression du score:', id);

        // Trouver et supprimer le score
        const score = await Score.findByIdAndDelete(id);

        if (!score) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Participation non trouvée'
            });
        }

        console.log('✅ Score supprimé:', score.firstName, score.lastName);

        return {
            success: true,
            message: 'Participation supprimée avec succès'
        };
    } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);

        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Erreur lors de la suppression'
        });
    }
});
