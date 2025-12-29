import jwt from "jsonwebtoken";

const runtimeConfig = useRuntimeConfig();
const SECRET = runtimeConfig.jwtSecret;

export function signToken(payload: object, expiresIn = "7d") {
    return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken<T = any>(token: string): T | null {
    try {
        return jwt.verify(token, SECRET) as T;
    } catch (err) {
        return null;
    }
}
