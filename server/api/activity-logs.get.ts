import { defineEventHandler, getQuery } from 'h3';
import Log from '../models/Log';

export default defineEventHandler(async (event) => {
    // Vérifier l'authentification
    if (!event.context.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Non autorisé'
        });
    }

    const query = getQuery(event);

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 50;
    const level = query.level as string;
    const action = query.action as string;
    const search = query.search as string;
    const startDate = query.startDate as string;
    const endDate = query.endDate as string;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (level && level !== 'all') {
        filter.level = level;
    }

    if (action && action !== 'all') {
        filter.action = action;
    }

    if (search) {
        filter.$or = [
            { message: { $regex: search, $options: 'i' } },
            { userEmail: { $regex: search, $options: 'i' } },
            { action: { $regex: search, $options: 'i' } }
        ];
    }

    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
            filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.timestamp.$lte = new Date(endDate);
        }
    }

    try {
        const [logs, total] = await Promise.all([
            Log.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Log.countDocuments(filter)
        ]);

        // Get distinct actions for filter dropdown
        const actions = await Log.distinct('action');

        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            actions
        };
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        throw createError({
            statusCode: 500,
            message: 'Erreur lors de la récupération des logs'
        });
    }
});
