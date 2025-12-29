import Procedure from "../../models/Procedure";

export default defineEventHandler(async (event) => {
    try {
        const procedures = await Procedure.find().sort({ order: 1, createdAt: -1 });
        return procedures;
    } catch (error: any) {
        console.error("❌ Erreur lors de la récupération des procédures:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la récupération des procédures"
        });
    }
});
