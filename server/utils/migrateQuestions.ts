import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Question from "../models/Question";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/webform-gbna";

async function migrateQuestions() {
    try {
        // Connexion à MongoDB
        console.log("Connexion à MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connecté à MongoDB");

        // Lire le fichier questions.json
        const questionsPath = path.join(process.cwd(), "public", "questions.json");
        console.log(`Lecture du fichier: ${questionsPath}`);

        const questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
        console.log(`📄 ${questionsData.length} questions trouvées dans le fichier JSON`);

        // Vérifier si des questions existent déjà
        const existingCount = await Question.countDocuments();

        if (existingCount > 0) {
            console.log(`⚠️  ${existingCount} questions existent déjà en base de données`);
            console.log("Voulez-vous continuer ? (Cela créera des doublons)");
            console.log("Pour éviter les doublons, supprimez d'abord les questions existantes");
            return;
        }

        // Insérer les questions
        console.log("Insertion des questions...");
        const result = await Question.insertMany(questionsData);

        console.log(`✅ ${result.length} questions importées avec succès !`);
        console.log("\nDétails:");
        result.forEach((q, index) => {
            console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...`);
        });

    } catch (error) {
        console.error("❌ Erreur lors de la migration:", error);
    } finally {
        // Fermer la connexion
        await mongoose.connection.close();
        console.log("\n🔌 Connexion fermée");
    }
}

// Exécuter la migration
migrateQuestions();
