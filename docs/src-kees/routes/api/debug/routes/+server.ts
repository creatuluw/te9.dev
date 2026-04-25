/**
 * Test endpoint to view all discovered routes
 * This helps verify that dynamic route discovery is working
 */

import { json } from '@sveltejs/kit';
import { getAllAvailableRoutes } from '$lib/config/routes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const routes = await getAllAvailableRoutes();

        // Group routes by type for easier viewing
        const grouped = {
            page: routes.filter(r => r.type === 'page'),
            api: routes.filter(r => r.type === 'api'),
            admin: routes.filter(r => r.type === 'admin')
        };

        return json({
            success: true,
            total: routes.length,
            grouped,
            allRoutes: routes.map(r => ({
                path: r.path,
                type: r.type,
                actions: r.actions,
                description: r.description,
                isPublic: r.isPublic
            }))
        });
    } catch (error) {
        console.error('Error getting routes:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
