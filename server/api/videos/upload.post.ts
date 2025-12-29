import fs from 'fs';
import path from 'path';
import { validateFileUpload, sanitizeFilename, logUploadAttempt } from '../../utils/fileUpload';
import { logger } from '../../utils/logger';

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const userId = (event.context.user as any)?.id || 'unknown';

    try {
        const formData = await readMultipartFormData(event);

        if (!formData || formData.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: "Aucun fichier reçu"
            });
        }

        const file = formData.find(f => f.name === 'video');

        if (!file || !file.data) {
            throw createError({
                statusCode: 400,
                statusMessage: "Fichier vidéo requis"
            });
        }

        // Validate file with security checks
        const validation = validateFileUpload(
            file.data,
            file.type || '',
            file.filename || '',
            {
                allowedMimeTypes: ['video/mp4'],
                allowedExtensions: ['.mp4'],
                maxSize: 100 * 1024 * 1024, // 100MB
                checkSignature: true
            }
        );

        if (!validation.valid) {
            logUploadAttempt(userId, file.filename || '', file.type || '', file.data.length, false, validation.error);
            throw createError({
                statusCode: 400,
                statusMessage: validation.error
            });
        }

        // Sanitize filename
        let filename = sanitizeFilename(file.filename || 'video', 'video');

        // Ensure .mp4 extension
        if (!filename.endsWith('.mp4')) {
            filename = filename.replace(/\.[^/.]+$/, '') + '.mp4';
        }

        // Ensure videos directory exists
        const videosDir = path.join(process.cwd(), 'public', 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
        }

        // Check if file exists and add number suffix if needed
        let finalFilename = filename;
        let counter = 1;
        while (fs.existsSync(path.join(videosDir, finalFilename))) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            finalFilename = `${base}_${counter}${ext}`;
            counter++;
        }

        // Write file
        const filePath = path.join(videosDir, finalFilename);
        fs.writeFileSync(filePath, file.data);

        logUploadAttempt(userId, finalFilename, file.type || '', file.data.length, true);

        // Log to database
        await logger.userAction(
            'FILE_UPLOAD',
            `Vidéo "${finalFilename}" uploadée (${Math.round(file.data.length / 1024 / 1024)}MB)`,
            userId,
            (event.context.user as any)?.email || (event.context.user as any)?.username,
            { fileType: 'video', filename: finalFilename, size: file.data.length, path: `/videos/${finalFilename}` }
        );

        return {
            success: true,
            video: {
                name: finalFilename,
                path: `/videos/${finalFilename}`,
                size: file.data.length
            },
            message: "Vidéo uploadée avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de l'upload de la vidéo:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de l'upload"
        });
    }
});
