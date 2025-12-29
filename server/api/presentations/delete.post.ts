import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    const { filename } = body;

    if (!filename) {
        throw createError({ statusCode: 400, statusMessage: "Filename is required" });
    }

    // Security: prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'presentations', sanitizedFilename);

    try {
        if (!fs.existsSync(filePath)) {
            throw createError({ statusCode: 404, statusMessage: "File not found" });
        }

        fs.unlinkSync(filePath);

        return { success: true, message: `Presentation "${sanitizedFilename}" deleted` };
    } catch (error: any) {
        console.error("❌ Error deleting presentation:", error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Error deleting presentation"
        });
    }
});
