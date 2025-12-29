import { getQuestionModel } from "../../models/Question";
import Formation from "../../models/Formation";

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
    try {
        // Récupérer le module depuis les query params
        const query = getQuery(event);
        const module = (query.module as string) || DEFAULT_MODULE;

        // Valider le module
        const isValid = await isValidModule(module);
        if (!isValid) {
            throw createError({
                statusCode: 400,
                statusMessage: `Module invalide: ${module}`,
            });
        }

        // Récupérer le modèle pour ce module
        const collectionName = await getCollectionName(module);
        const QuestionModel = getQuestionModel(collectionName);

        // Récupérer toutes les questions, triées par date de création
        const questions = await QuestionModel.find().sort({ createdAt: 1 });

        return questions;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des questions:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la récupération des questions",
        });
    }
});
