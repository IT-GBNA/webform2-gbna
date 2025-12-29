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
        const body = await readBody(event);

        // Récupérer et valider le module
        const module = body.module || DEFAULT_MODULE;
        const isValid = await isValidModule(module);
        if (!isValid) {
            throw createError({
                statusCode: 400,
                statusMessage: `Module invalide: ${module}`,
            });
        }

        // Validation des données
        if (!body.question || !body.answerOptions || !body.explanation) {
            throw createError({
                statusCode: 400,
                statusMessage: "Données manquantes",
            });
        }

        if (!Array.isArray(body.answerOptions) || body.answerOptions.length < 2) {
            throw createError({
                statusCode: 400,
                statusMessage: "Au moins 2 options de réponse sont requises",
            });
        }

        // Récupérer le modèle pour ce module
        const collectionName = await getCollectionName(module);
        const QuestionModel = getQuestionModel(collectionName);

        // Créer la nouvelle question
        const newQuestion = await QuestionModel.create({
            question: body.question,
            answerOptions: body.answerOptions,
            explanation: body.explanation,
        });

        // Log the creation
        await logger.userAction(
            'QUESTION_CREATE',
            `Question créée dans le module "${module}"`,
            event.context.user.id,
            event.context.user.email || event.context.user.username,
            { moduleId: module, questionId: newQuestion._id, questionText: body.question.substring(0, 50) }
        );

        return {
            success: true,
            question: newQuestion,
        };
    } catch (error: any) {
        console.error("Erreur lors de la création de la question:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la création de la question",
        });
    }
});
