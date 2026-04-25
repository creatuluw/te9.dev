/**
 * Cursor theme - Clean, modern design inspired by cursor.com/features
 * Light cream background with dark text and orange accents
 */

import type { Theme } from '$lib/types/theme';

export const cursorTheme: Theme = {
	id: 'cursor',
	name: 'Cursor',
	description: 'Clean, modern design inspired by cursor.com',

	colors: {
		primary: '#26251e', // Dark text color used for primary buttons
		secondary: '#f54e00', // Orange accent from Cursor
		background: '#f7f7f4', // Light cream background
		surface: '#ffffff', // White surface/cards
		text: {
			primary: '#26251e', // Dark brown-grey text
			secondary: '#52525b', // Zinc-600 for secondary text
			muted: '#a1a1aa' // Zinc-400 for muted text
		},
		border: '#e4e4e7', // Light gray border (zinc-200)
		focus: '#f54e00', // Orange for focus states
		error: '#ef4444',
		success: '#10b981',
		warning: '#f59e0b'
	},

	fonts: {
		heading: 'CursorGothic, Inter, sans-serif', // CursorGothic if available, fallback to Inter
		body: 'CursorGothic, Inter, sans-serif', // CursorGothic if available, fallback to Inter
		mono: 'berkeleyMono, PT Mono, monospace' // berkeleyMono if available, fallback to PT Mono
	},

	shadows: {
		xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)'
	}
};

