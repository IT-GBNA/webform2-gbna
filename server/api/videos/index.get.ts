import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const videosDir = path.join(process.cwd(), 'public', 'videos');

        // Create directory if it doesn't exist
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
            return { videos: [] };
        }

        // List video files
        const files = fs.readdirSync(videosDir);
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];

        const videos = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return videoExtensions.includes(ext);
            })
            .map(file => {
                const filePath = path.join(videosDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: `/videos/${file}`,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

        return { videos };
    } catch (error: any) {
        console.error("❌ Erreur lors de la lecture du dossier videos:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la lecture des vidéos"
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
