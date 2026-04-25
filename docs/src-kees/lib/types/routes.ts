export type RouteType = 'page' | 'api' | 'admin';
export type RouteAction = 'read' | 'write' | 'update' | 'delete' | 'execute';

export interface RouteNavigation {
    label: string;
    icon?: string;
    showInNav: boolean;
    order?: number;
    group?: string; // e.g., 'main', 'admin', 'tools'
    dropdownItems?: Array<{
        label: string;
        href: string;
    }>;
}

export interface RouteDefinition {
    path: string; // e.g., '/cases', '/admin/users', '/api/cases'
    type: RouteType;
    actions: RouteAction[];
    navigation?: RouteNavigation;
    description?: string;
    pattern?: RegExp; // Pattern for dynamic routes (e.g., /^\/cases\/\d+$/)
    defaultAction?: RouteAction; // Default action for route protection
    isPublic?: boolean; // Public routes don't require authentication
}
