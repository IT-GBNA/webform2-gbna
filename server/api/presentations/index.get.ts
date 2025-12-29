import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const presentationsDir = path.join(process.cwd(), 'public', 'presentations');

        // Create directory if it doesn't exist
        if (!fs.existsSync(presentationsDir)) {
            fs.mkdirSync(presentationsDir, { recursive: true });
            return { presentations: [] };
        }

        // List presentation files
        const files = fs.readdirSync(presentationsDir);
        const presentationExtensions = ['.pptx', '.ppt', '.pdf'];

        const presentations = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return presentationExtensions.includes(ext);
            })
            .map(file => {
                const filePath = path.join(presentationsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: `/presentations/${file}`,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    modifiedAt: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

        return { presentations };
    } catch (error: any) {
        console.error("❌ Erreur lors de la lecture des présentations:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la lecture des présentations"
        });
    }
});

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
