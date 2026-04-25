<script lang="ts">
	import '../../app.css';
	import '../../style.css';
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/img/icon.png" />
	{@html `<script>
		// Initialize theme immediately before page renders
		(function() {
			try {
				const saved = localStorage.getItem('theme');
				const validThemes = ['default', 'catalyst', 'pglite', 'planet', 'trevor', 'cursor', 'dreams'];
				const themeId = saved && validThemes.includes(saved) ? saved : 'default';
				
				// Apply default theme immediately
				const root = document.documentElement;
				root.style.setProperty('--theme-background', '#ffffff');
				root.style.setProperty('--theme-text-primary', '#18181b');
				root.style.setProperty('--theme-text-secondary', '#52525b');
				root.style.setProperty('--theme-text-muted', '#a1a1aa');
				root.style.setProperty('--theme-border', '#e4e4e7');
				root.style.setProperty('--theme-surface', '#fafafa');
				root.style.setProperty('--theme-focus', '#FE773C');
				root.style.setProperty('--theme-primary', '#3b82f6');
				
				if (themeId === 'catalyst') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#000000');
					root.style.setProperty('--theme-text-secondary', '#000000');
					root.style.setProperty('--theme-text-muted', '#1a1a1a');
					root.style.setProperty('--theme-border', '#000000');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#3b82f6');
					root.style.setProperty('--theme-secondary', '#facc15');
					root.setAttribute('data-theme', 'catalyst');
				} else if (themeId === 'pglite') {
					root.style.setProperty('--theme-background', '#1a1a1a');
					root.style.setProperty('--theme-text-primary', '#ffffff');
					root.style.setProperty('--theme-text-secondary', '#e4e4e7');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#3f3f46');
					root.style.setProperty('--theme-surface', '#27272a');
					root.style.setProperty('--theme-primary', '#fde047');
					root.style.setProperty('--theme-secondary', '#facc15');
					root.style.setProperty('--theme-focus', '#fde047');
					root.setAttribute('data-theme', 'pglite');
				} else if (themeId === 'planet') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#3a3b36');
					root.style.setProperty('--theme-text-secondary', '#52525b');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#3a3b36');
					root.style.setProperty('--theme-secondary', '#f97316');
					root.style.setProperty('--theme-focus', '#f97316');
					root.setAttribute('data-theme', 'planet');
				} else if (themeId === 'trevor') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#416288');
					root.style.setProperty('--theme-text-secondary', '#3a3b36');
					root.style.setProperty('--theme-text-muted', '#52525b');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#ffca38');
					root.style.setProperty('--theme-secondary', '#416288');
					root.style.setProperty('--theme-focus', '#ffca38');
					root.setAttribute('data-theme', 'trevor');
				} else if (themeId === 'cursor') {
					root.style.setProperty('--theme-background', '#f7f7f4');
					root.style.setProperty('--theme-text-primary', '#26251e');
					root.style.setProperty('--theme-text-secondary', '#52525b');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#26251e');
					root.style.setProperty('--theme-secondary', '#f54e00');
					root.style.setProperty('--theme-focus', '#f54e00');
					root.setAttribute('data-theme', 'cursor');
				} else {
					root.setAttribute('data-theme', 'default');
				}
			} catch (e) {
				console.warn('Theme initialization error:', e);
			}
		})();
	</script>`}
</svelte:head>

<!-- Blank layout - no header, no navigation, just the page content -->
{@render children?.()}

