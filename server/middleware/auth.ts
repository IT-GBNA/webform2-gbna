import { verifyToken } from "../utils/jwt";
import User from "../models/User";

export default defineEventHandler(async (event) => {
    // 1. Vérifier d'abord le token JWT (cookie)
    const token = getCookie(event, "token");

    if (token) {
        try {
            const decoded = verifyToken(token);
            if (decoded) {
                event.context.user = decoded;
                return;
            }
        } catch (_) {
            // token invalide => on continue
        }
    }

    // 2. Sinon, vérifier la clé API (header X-API-Key)
    const apiKey = getHeader(event, 'X-API-Key');

    if (apiKey) {
        try {
            const user = await User.findOne({ apiKey }).select('-password');
            if (user) {
                event.context.user = {
                    id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    viaApiKey: true
                };
                return;
            }
        } catch (_) {
            // Clé API invalide => on ignore
        }
    }
});
