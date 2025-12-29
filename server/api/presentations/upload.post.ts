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

        const file = formData.find(f => f.name === 'presentation');

        if (!file || !file.data) {
            throw createError({
                statusCode: 400,
                statusMessage: "Fichier PDF requis"
            });
        }

        // Validate file with security checks
        const validation = validateFileUpload(
            file.data,
            file.type || '',
            file.filename || '',
            {
                allowedMimeTypes: ['application/pdf'],
                allowedExtensions: ['.pdf'],
                maxSize: 50 * 1024 * 1024, // 50MB
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
        let filename = sanitizeFilename(file.filename || 'document', 'document');

        // Ensure .pdf extension
        if (!filename.endsWith('.pdf')) {
            filename = filename.replace(/\.[^/.]+$/, '') + '.pdf';
        }

        // Ensure presentations directory exists
        const presentationsDir = path.join(process.cwd(), 'public', 'presentations');
        if (!fs.existsSync(presentationsDir)) {
            fs.mkdirSync(presentationsDir, { recursive: true });
        }

        // Check if file exists and add number suffix if needed
        let finalFilename = filename;
        let counter = 1;
        while (fs.existsSync(path.join(presentationsDir, finalFilename))) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            finalFilename = `${base}_${counter}${ext}`;
            counter++;
        }

        // Write file
        const filePath = path.join(presentationsDir, finalFilename);
        fs.writeFileSync(filePath, file.data);

        logUploadAttempt(userId, finalFilename, file.type || '', file.data.length, true);

        // Log to database
        await logger.userAction(
            'FILE_UPLOAD',
            `PDF "${finalFilename}" uploadé (${Math.round(file.data.length / 1024 / 1024)}MB)`,
            userId,
            (event.context.user as any)?.email || (event.context.user as any)?.username,
            { fileType: 'pdf', filename: finalFilename, size: file.data.length, path: `/presentations/${finalFilename}` }
        );

        return {
            success: true,
            presentation: {
                name: finalFilename,
                path: `/presentations/${finalFilename}`,
                size: file.data.length
            },
            message: "PDF uploadé avec succès"
        };
    } catch (error: any) {
        console.error("❌ Erreur lors de l'upload du PDF:", error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erreur lors de l'upload"
        });
    }
});
