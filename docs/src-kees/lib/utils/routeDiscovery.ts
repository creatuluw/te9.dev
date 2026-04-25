import type { RouteDefinition, RouteType, RouteAction } from '$lib/types/routes';

/**
 * Dynamically discover routes from the file system using Vite's import.meta.glob
 * 
 * This allows us to automatically find all pages in the application
 * without manually registering them in the routes configuration.
 * 
 * Note: API endpoints (+server.ts files) are NOT discovered here to avoid importing
 * server-only code (like $env/static/private) into client bundles. All API routes
 * should be defined statically in routes.ts.
 */
export function getDynamicRoutes(): RouteDefinition[] {
    // Use import.meta.glob to find all page route files
    // This is a Vite-specific feature that works at build/runtime
    // Note: We exclude +server.ts files to avoid importing server-only code into client bundles
    // API routes are defined statically in routes.ts
    const modules = import.meta.glob([
        '/src/routes/**/+page.svelte'
    ]);

    const routesMap = new Map<string, RouteDefinition>();

    for (const path in modules) {
        // Parse the file path to get the route path
        // Example: /src/routes/admin/users/+page.svelte -> /admin/users
        // Example: /src/routes/(app)/dashboard/+page.svelte -> /dashboard

        let routePath = path
            .replace('/src/routes', '') // Remove base path
            .replace(/\/\+page\.svelte$/, ''); // Remove page file

        // Handle root route
        if (routePath === '') {
            routePath = '/';
        }

        // Remove route groups (e.g., /(app)/ -> /)
        // We replace '/(groupname)' with ''
        routePath = routePath.replace(/\/\([^)]+\)/g, '');

        // Clean up double slashes if any resulted from replacements
        routePath = routePath.replace(/\/+/g, '/');

        // Ensure it starts with / (unless it's empty which means root, handled above)
        if (!routePath.startsWith('/')) {
            routePath = '/' + routePath;
        }

        // Remove trailing slash if not root
        if (routePath !== '/' && routePath.endsWith('/')) {
            routePath = routePath.slice(0, -1);
        }

        // All discovered routes are pages (API routes are defined statically in routes.ts)
        const type: RouteType = 'page';
        const actions: RouteAction[] = ['read'];
        const defaultAction: RouteAction = 'read';

        // Check if we already found this route
        if (routesMap.has(routePath)) {
            // Route already exists, skip (shouldn't happen for pages, but handle gracefully)
            continue;
        } else {
            // Create new route definition
            // We can't easily infer description or navigation from file system
            // These will be merged with static routes in routes.ts
            routesMap.set(routePath, {
                path: routePath,
                type,
                actions,
                defaultAction,
                // Add a pattern for dynamic routes (containing [param])
                pattern: routePath.includes('[') ? createRoutePattern(routePath) : undefined
            });
        }
    }

    return Array.from(routesMap.values());
}

/**
 * Create a RegExp pattern for a dynamic route path
 * Replaces [param] with [^/]+ (matches one path segment)
 * Replaces [...param] with .* (matches rest of path) - simplified
 */
function createRoutePattern(path: string): RegExp {
    // Escape special regex characters except [ and ] which we need to parse
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace \[param\] with regex for segment
    // We need to handle the escaped brackets
    // The path string has literal [ and ] which got escaped to \[ and \]

    // Actually, let's do it on the unescaped string carefully or unescape brackets
    // Simpler approach: split by segments

    const segments = path.split('/');
    const regexSegments = segments.map(segment => {
        if (segment.startsWith('[') && segment.endsWith(']')) {
            if (segment.startsWith('[...')) {
                // Catch-all route
                return '.*';
            }
            // Dynamic segment
            return '[^/]+';
        }
        // Static segment - escape it
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });

    return new RegExp(`^${regexSegments.join('/')}$`);
}
