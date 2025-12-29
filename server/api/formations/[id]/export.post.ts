import { runExport } from '../../../services/exportService';

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
            statusMessage: 'ID de formation requis'
        });
    }

    try {
        // Lire le body pour récupérer un éventuel configId
        const body = await readBody(event).catch(() => ({}));
        const configId = body?.configId;

        // Passer le contexte utilisateur pour le logging et rate limiting
        const result = await runExport(id, {
            triggeredBy: 'manual',
            userId: event.context.user.id,
            username: event.context.user.username
        }, configId);

        if (!result.success) {
            throw createError({
                statusCode: 400,
                statusMessage: result.message
            });
        }

        return {
            success: true,
            message: result.message,
            recipientCount: result.recipientCount
        };
    } catch (error: any) {
        console.error('❌ Erreur export:', error);

        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Erreur lors de l\'export'
        });
    }
});
