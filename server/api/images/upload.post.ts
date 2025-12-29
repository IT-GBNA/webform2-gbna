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

        const file = formData.find(f => f.name === 'image');

        if (!file || !file.data) {
            throw createError({
                statusCode: 400,
                statusMessage: "Fichier image requis"
            });
        }

        // Validate file with security checks
        const validation = validateFileUpload(
            file.data,
            file.type || '',
            file.filename || '',
            {
                allowedMimeTypes: ['image/png', 'image/jpeg'],
                allowedExtensions: ['.png', '.jpg', '.jpeg'],
                maxSize: 10 * 1024 * 1024, // 10MB
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
        let filename = sanitizeFilename(file.filename || 'image', 'image');

        // Ensure images directory exists
        const imagesDir = path.join(process.cwd(), 'public', 'images', 'formations');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Check if file exists and add number suffix if needed
        let finalFilename = filename;
        let counter = 1;
        while (fs.existsSync(path.join(imagesDir, finalFilename))) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            finalFilename = `${base}_${counter}${ext}`;
            counter++;
        }

        // Write file
        const filePath = path.join(imagesDir, finalFilename);
        fs.writeFileSync(filePath, file.data);

        logUploadAttempt(userId, finalFilename, file.type || '', file.data.length, true);

        // Log to database
        await logger.userAction(
            'FILE_UPLOAD',
            `Image "${finalFilename}" uploadée (${Math.round(file.data.length / 1024)}KB)`,
            userId,
            (event.context.user as any)?.email || (event.context.user as any)?.username,
            { fileType: 'image', filename: finalFilename, size: file.data.length, path: `/images/formations/${finalFilename}` }
        );

        return {
            success: true,
            image: {
                name: finalFilename,
                path: `/images/formations/${finalFilename}`,
                size: file.data.length
            },
            message: "Image uploadée avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de l'upload de l'image:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de l'upload"
        });
    }
});
