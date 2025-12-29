import bcrypt from "bcryptjs";
import User from "../../models/User";
import { logger } from "../../utils/logger";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { username, password } = body;

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }

  const user = await User.findOne({ username });

  if (!user) {
    // Log failed attempt
    await logger.warning('LOGIN_FAILED', `Tentative de connexion échouée pour "${username}" - Utilisateur non trouvé`);
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    // Log failed attempt
    await logger.warning('LOGIN_FAILED', `Tentative de connexion échouée pour "${username}" - Mot de passe incorrect`);
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  const token = signToken({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  setCookie(event, "token", token, {
    httpOnly: true,
    secure: false, // mettre true en prod
    sameSite: "strict",
    maxAge: 60 * 60,
    path: "/",
  });

  // Log successful login
  await logger.userAction('LOGIN', `Connexion réussie`, user._id.toString(), user.email || user.username);

  return {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
});
