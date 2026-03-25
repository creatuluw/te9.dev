/**
 * Type definitions for UI components
 * Extracted from homepage for reusability across the application
 */

/**
 * PathData - Union type supporting various SVG element types
 * Each variant represents a different SVG element with its specific attributes
 */
export type PathData =
	| {
			d: string;
			rect?: undefined;
			polyline?: undefined;
			line?: undefined;
			circle?: undefined;
	  }
	| {
			d?: undefined;
			rect: {
				x: string;
				y: string;
				width: string;
				height: string;
				rx: string;
			};
			polyline?: undefined;
			line?: undefined;
			circle?: undefined;
	  }
	| {
			d?: undefined;
			rect?: undefined;
			polyline: { points: string };
			line?: undefined;
			circle?: undefined;
	  }
	| {
			d?: undefined;
			rect?: undefined;
			polyline?: undefined;
			line: { x1: string; y1: string; x2: string; y2: string };
			circle?: undefined;
	  }
	| {
			d?: undefined;
			rect?: undefined;
			polyline?: undefined;
			line?: undefined;
			circle: { cx: string; cy: string; r: string };
	  };

/**
 * GardenCard - Represents a card in the garden section
 * @property paths - Array of SVG path data for the icon
 * @property title - Card title
 * @property desc - Card description
 * @property tag - Category tag for the card
 */
export interface GardenCard {
	paths: PathData[];
	title: string;
	desc: string;
	tag: string;
}

/**
 * QuickLink - Represents a quick link item
 * @property href - URL destination
 * @property name - Display name for the link
 * @property desc - Brief description of the link destination
 */
export interface QuickLink {
	href: string;
	name: string;
	desc: string;
}
