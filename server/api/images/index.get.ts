import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    // Authentication required
    if (!event.context.user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    try {
        const imagesDir = path.join(process.cwd(), 'public', 'images', 'formations');

        // Create directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
            return { images: [] };
        }

        // List image files
        const files = fs.readdirSync(imagesDir);
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

        const images = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .map(file => {
                const filePath = path.join(imagesDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: `/images/formations/${file}`,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    modifiedAt: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

        return { images };
    } catch (error: any) {
        console.error("❌ Erreur lors de la lecture des images:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Erreur lors de la lecture des images"
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
