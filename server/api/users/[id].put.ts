import User from "../../models/User";
import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
    // Vérifier l'authentification
    if (!event.context.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Non autorisé'
        });
    }

    const id = getRouterParam(event, 'id');
    const body = await readBody(event);

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID utilisateur requis'
        });
    }

    try {
        const updateData: any = {};

        if (body.username) {
            // Check if username is taken by another user
            const existingUser = await User.findOne({
                username: body.username.toLowerCase(),
                _id: { $ne: id }
            });
            if (existingUser) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Ce nom d\'utilisateur existe déjà'
                });
            }
            updateData.username = body.username.toLowerCase();
        }

        if (body.email !== undefined) {
            updateData.email = body.email || undefined;
        }

        if (body.role) {
            updateData.role = body.role;
        }

        // Only update password if provided
        if (body.password) {
            updateData.password = await bcrypt.hash(body.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Utilisateur non trouvé'
            });
        }

        return user;
    } catch (error: any) {
        if (error.statusCode) throw error;

        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la mise à jour de l\'utilisateur'
        });
    }
});
