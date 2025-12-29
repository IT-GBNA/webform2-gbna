import Log from '../models/Log';


interface LogEntry {
    level: 'info' | 'warning' | 'error' | 'debug';
    action: string;
    message: string;
    userId?: string;
    userEmail?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

/**
 * Utility function to create a log entry
 */
export async function createLog(entry: LogEntry): Promise<void> {
    try {
        await Log.create({
            ...entry,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to create log entry:', error);
    }
}

/**
 * Helper functions for common log types
 */
export const logger = {
    info: (action: string, message: string, metadata?: Record<string, any>) =>
        createLog({ level: 'info', action, message, metadata }),

    warning: (action: string, message: string, metadata?: Record<string, any>) =>
        createLog({ level: 'warning', action, message, metadata }),

    error: (action: string, message: string, metadata?: Record<string, any>) =>
        createLog({ level: 'error', action, message, metadata }),

    debug: (action: string, message: string, metadata?: Record<string, any>) =>
        createLog({ level: 'debug', action, message, metadata }),

    // User action logging with user info
    userAction: (action: string, message: string, userId?: string, userEmail?: string, metadata?: Record<string, any>) =>
        createLog({ level: 'info', action, message, userId, userEmail, metadata })
};
