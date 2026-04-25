/**
 * Breadcrumb item interface
 * 
 * Represents a single breadcrumb navigation item.
 * 
 * @example
 * ```typescript
 * const items: BreadcrumbItem[] = [
 *   { label: 'Home', href: '/' },
 *   { label: 'Cases', href: '/cases' },
 *   { label: 'Case Details' } // Current page (no href)
 * ];
 * ```
 */
export interface BreadcrumbItem {
	/**
	 * Display label for the breadcrumb item
	 */
	label: string;
	
	/**
	 * Optional URL path (if not provided, item is non-clickable/current page)
	 */
	href?: string;
}

