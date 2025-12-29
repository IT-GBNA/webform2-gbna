import Formation from "../../models/Formation";

export default defineEventHandler(async (event) => {
    try {
        const formations = await Formation.find({}).sort({ order: 1 });
        return formations;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des formations:", error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la récupération des formations'
        });
    }
});
