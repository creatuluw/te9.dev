/**
 * Catalyst theme - Neo-brutalist design inspired by catalyst.bontal.net
 * Bold, high-contrast design with thick borders, offset shadows, and vibrant accents
 */

import type { Theme } from '$lib/types/theme';

export const catalystTheme: Theme = {
	id: 'catalyst',
	name: 'Catalyst',
	description: 'Neo-brutalist design with thick borders, bold typography, and vibrant accents',

	colors: {
		primary: '#3b82f6', // Blue-500
		secondary: '#facc15', // Yellow-400 (main accent color from site)
		background: '#ffffff', // Pure white
		surface: '#ffffff', // White cards
		text: {
			primary: '#000000', // Pure black for high contrast
			secondary: '#000000', // Black for consistency
			muted: '#1a1a1a' // Very dark gray
		},
		border: '#000000', // Pure black thick borders
		focus: '#3b82f6', // Blue focus
		error: '#ef4444', // Red
		success: '#22c55e', // Green-500
		warning: '#f97316' // Orange-500
	},

	fonts: {
		heading: 'Inter, sans-serif', // Bold, black weight
		body: 'Inter, sans-serif', // Inter font
		mono: 'PT Mono, monospace' // Monospace for code
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		sm: '4px 4px 0px 0px rgba(0,0,0,1)', // Offset shadow for neo-brutalist effect
		md: '8px 8px 0px 0px rgba(0,0,0,1)' // Larger offset shadow
	}
};
