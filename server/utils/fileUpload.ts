/**
 * File Upload Security Utilities
 * Validates files using magic bytes (file signatures) to prevent spoofing
 */

// Magic bytes signatures for different file types
const FILE_SIGNATURES: Record<string, { signature: number[], offset?: number }[]> = {
    // Videos
    'video/mp4': [
        { signature: [0x00, 0x00, 0x00], offset: 0 }, // ftyp box (partial check)
        { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // 'ftyp' at offset 4
    ],

    // Images
    'image/png': [
        { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] } // PNG header
    ],
    'image/jpeg': [
        { signature: [0xFF, 0xD8, 0xFF] } // JPEG header
    ],

    // Documents
    'application/pdf': [
        { signature: [0x25, 0x50, 0x44, 0x46] } // %PDF
    ],
};

/**
 * Verify file signature (magic bytes) matches expected type
 */
export function verifyFileSignature(buffer: Buffer, expectedType: string): boolean {
    const signatures = FILE_SIGNATURES[expectedType];

    if (!signatures || signatures.length === 0) {
        // No signature defined for this type - allow but log warning
        console.warn(`⚠️ No signature defined for type: ${expectedType}`);
        return true;
    }

    // Check at least one signature matches
    return signatures.some(sig => {
        const offset = sig.offset || 0;
        if (buffer.length < offset + sig.signature.length) {
            return false;
        }

        return sig.signature.every((byte, index) => {
            return buffer[offset + index] === byte;
        });
    });
}

/**
 * Validate file for upload security
 */
export function validateFileUpload(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    config: {
        allowedMimeTypes: string[];
        allowedExtensions: string[];
        maxSize: number;
        checkSignature?: boolean;
    }
): { valid: boolean; error?: string } {
    // 1. Check file size
    if (buffer.length > config.maxSize) {
        const maxMB = Math.round(config.maxSize / (1024 * 1024));
        return { valid: false, error: `Le fichier ne doit pas dépasser ${maxMB} Mo` };
    }

    if (buffer.length === 0) {
        return { valid: false, error: 'Le fichier est vide' };
    }

    // 2. Check MIME type
    const isValidMime = config.allowedMimeTypes.includes(mimeType);

    // 3. Check extension
    const ext = filename.toLowerCase().split('.').pop() || '';
    const isValidExt = config.allowedExtensions.includes(`.${ext}`);

    if (!isValidMime && !isValidExt) {
        return { valid: false, error: `Type de fichier non autorisé. Formats acceptés: ${config.allowedExtensions.join(', ')}` };
    }

    // 4. Verify magic bytes (if enabled)
    if (config.checkSignature !== false) {
        // Find matching expected type
        const expectedType = config.allowedMimeTypes.find(type =>
            FILE_SIGNATURES[type] && verifyFileSignature(buffer, type)
        );

        if (!expectedType && config.allowedMimeTypes.some(type => FILE_SIGNATURES[type])) {
            // We have signatures defined but none matched
            return { valid: false, error: 'Le contenu du fichier ne correspond pas au type déclaré' };
        }
    }

    // 5. Check for suspicious content in filename
    const suspiciousPatterns = [
        /\.\./,           // Directory traversal
        /[<>:"|?*]/,      // Invalid Windows characters
        /\x00/,           // Null byte
        /\.(exe|bat|cmd|sh|php|asp|jsp|cgi|dll)$/i, // Executable extensions
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(filename)) {
            return { valid: false, error: 'Nom de fichier invalide' };
        }
    }

    return { valid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string, defaultName: string = 'file'): string {
    let name = filename || defaultName;

    // Remove path components
    name = name.split(/[\\/]/).pop() || defaultName;

    // Remove dangerous characters
    name = name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^[._-]+/, '')
        .toLowerCase();

    // Ensure reasonable length
    if (name.length > 100) {
        const ext = name.split('.').pop() || '';
        const base = name.slice(0, 90);
        name = `${base}.${ext}`;
    }

    // Ensure we have a name
    if (!name || name === '.') {
        name = defaultName;
    }

    return name;
}

/**
 * Log upload attempt for security audit
 */
export function logUploadAttempt(
    userId: string | undefined,
    filename: string,
    mimeType: string,
    size: number,
    success: boolean,
    error?: string
): void {
    const timestamp = new Date().toISOString();
    const status = success ? '✅' : '❌';
    const sizeKB = Math.round(size / 1024);

    console.log(`${status} [${timestamp}] Upload: user=${userId || 'unknown'}, file=${filename}, type=${mimeType}, size=${sizeKB}KB${error ? `, error=${error}` : ''}`);
}
