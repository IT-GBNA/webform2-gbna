import User from "../../models/User";

export default defineEventHandler(async (event) => {
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const dbUser = await User.findById(event.context.user.id);
    if (!dbUser) {
        throw createError({ statusCode: 401, statusMessage: "User not found" });
    }

    return {
        id: dbUser._id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role
    };
});
