import mongoose from "mongoose";

const answerOptionSchema = new mongoose.Schema({
    answer: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        default: false,
    },
});

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        answerOptions: {
            type: [answerOptionSchema],
            required: true,
            validate: {
                validator: function (v: any[]) {
                    return v && v.length >= 2;
                },
                message: "Une question doit avoir au moins 2 options de réponse",
            },
        },
        explanation: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index pour optimiser les recherches
questionSchema.index({ createdAt: -1 });

// Cache pour stocker les modèles créés
const modelCache: { [key: string]: any } = {};

/**
 * Factory function pour créer un modèle Question pour un module spécifique
 * @param collectionName - Nom de la collection MongoDB (ex: 'form_1', 'form_2')
 * @returns Modèle Mongoose pour la collection spécifiée
 */
export function getQuestionModel(collectionName: string = 'form_1') {
    // Vérifier si le modèle existe déjà dans le cache
    if (modelCache[collectionName]) {
        return modelCache[collectionName];
    }

    // Créer un nouveau modèle pour cette collection
    const modelName = `Question_${collectionName}`;
    const model = mongoose.model(modelName, questionSchema, collectionName);

    // Mettre en cache
    modelCache[collectionName] = model;

    return model;
}

// Export du modèle par défaut pour la rétrocompatibilité
const Question = getQuestionModel('form_1');

export default Question;
