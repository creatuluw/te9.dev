/**
 * Dreams theme - Terminal/cyberpunk aesthetic inspired by dreams.fun
 * Dark olive-green background with bright neon yellow-green accents
 * Typography: Bokor for headings, IBM Plex Mono for body/mono (terminal aesthetic)
 */

import type { Theme } from '$lib/types/theme';

export const dreamsTheme: Theme = {
	id: 'dreams',
	name: 'Dreams',
	description: 'Terminal/cyberpunk aesthetic with neon yellow-green on dark olive background',

	colors: {
		primary: 'oklch(90.4% .1703 109.372)', // Bright neon yellow-green
		secondary: 'oklch(70.11% .1308 109.346)', // Secondary/muted yellow-green
		background: 'oklch(25.84% .0457 121.766)', // Very dark olive-green
		surface: 'oklch(25.94% .0452 120.092)', // Slightly lighter than background (card surface)
		text: {
			primary: 'oklch(90.4% .1703 109.372)', // Bright neon yellow-green for primary text
			secondary: 'oklch(70.11% .1308 109.346)', // Muted yellow-green for secondary text
			muted: 'oklch(61.53% .1138 109.325)' // More muted for subtle text
		},
		border: 'oklch(42.54% .0867 119.587)', // Darker yellow-green for borders
		focus: 'oklch(90.4% .1703 109.372)', // Bright neon yellow-green for focus states
		error: 'oklch(48.79% .2478 272.393)', // Red-ish error color from the CSS
		success: 'oklch(72.3% .219 149.579)', // Green success
		warning: 'oklch(79.5% .184 86.047)' // Yellow warning
	},

	fonts: {
		heading: 'Bokor, IBM Plex Mono, monospace', // Bokor for headings (display font), fallback to IBM Plex Mono
		body: 'IBM Plex Mono, monospace', // IBM Plex Mono for terminal aesthetic
		mono: 'IBM Plex Mono, monospace' // Consistent monospace throughout
	},

	shadows: {
		xs: '1px 1px 2px 0px #e0e0521a', // Yellow-green tinted shadow
		sm: '1px 1px 2px 0px #e0e05233, 1px 1px 2px -1px #e0e05233' // Multiple layers with yellow-green tint
	}
};

