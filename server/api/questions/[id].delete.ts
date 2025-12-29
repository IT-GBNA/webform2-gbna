import { getQuestionModel } from "../../models/Question";
import Formation from "../../models/Formation";
import { logger } from "../../utils/logger";

const DEFAULT_MODULE = 'form_1';

async function isValidModule(moduleId: string): Promise<boolean> {
    const formation = await Formation.findOne({ id: moduleId });
    return !!formation;
}

async function getCollectionName(moduleId: string): Promise<string> {
    const formation = await Formation.findOne({ id: moduleId });
    return formation ? formation.collectionName : moduleId;
}

export default defineEventHandler(async (event) => {
    // Vérifier l'authentification
    if (!event.context.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Non authentifié",
        });
    }

    try {
        const id = getRouterParam(event, "id");
        const query = getQuery(event);

        // Récupérer et valider le module
        const module = (query.module as string) || DEFAULT_MODULE;
        const isValid = await isValidModule(module);
        if (!isValid) {
            throw createError({
                statusCode: 400,
                statusMessage: `Module invalide: ${module}`,
            });
        }

        // Validation de l'ID
        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: "ID manquant",
            });
        }

        // Récupérer le modèle pour ce module
        const collectionName = await getCollectionName(module);
        const QuestionModel = getQuestionModel(collectionName);

        // Supprimer la question
        const deletedQuestion = await QuestionModel.findByIdAndDelete(id);

        if (!deletedQuestion) {
            throw createError({
                statusCode: 404,
                statusMessage: "Question non trouvée",
            });
        }

        // Log the deletion
        await logger.userAction(
            'QUESTION_DELETE',
            `Question supprimée du module "${module}"`,
            event.context.user.id,
            event.context.user.email || event.context.user.username,
            { moduleId: module, questionId: id }
        );

        return {
            success: true,
            message: "Question supprimée avec succès",
        };
    } catch (error: any) {
        console.error("Erreur lors de la suppression de la question:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la suppression de la question",
        });
    }
});
