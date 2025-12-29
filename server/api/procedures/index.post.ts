import Procedure from "../../models/Procedure";

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Non autorisé" });
    }

    try {
        const body = await readBody(event);

        const { id, title, description, category, fileUrl, order, published } = body;

        if (!id || !title || !description) {
            throw createError({
                statusCode: 400,
                statusMessage: "ID, titre et description requis"
            });
        }

        // Check if ID already exists
        const existing = await Procedure.findOne({ id });
        if (existing) {
            throw createError({
                statusCode: 400,
                statusMessage: "Une procédure avec cet ID existe déjà"
            });
        }

        const procedure = await Procedure.create({
            id,
            title,
            description,
            category: category || 'general',
            fileUrl: fileUrl || '',
            order: order || 0,
            published: published !== false
        });

        return procedure;
    } catch (error: any) {
        console.error("❌ Erreur lors de la création de la procédure:", error);
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de la création"
        });
    }
});
