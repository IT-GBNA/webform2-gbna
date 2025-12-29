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

    const body = await readBody(event);

    if (!body.username || !body.password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Nom d\'utilisateur et mot de passe requis'
        });
    }

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username: body.username.toLowerCase() });
        if (existingUser) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Ce nom d\'utilisateur existe déjà'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Create user
        const user = await User.create({
            username: body.username.toLowerCase(),
            email: body.email || undefined,
            password: hashedPassword,
            role: body.role || 'admin'
        });

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return userResponse;
    } catch (error: any) {
        if (error.statusCode) throw error;

        console.error('Erreur création utilisateur:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erreur lors de la création de l\'utilisateur: ' + (error.message || 'Erreur inconnue')
        });
    }
});
