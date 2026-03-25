<script lang="ts">
	// BackgroundEffects.svelte - Purely presentational component
	// Renders noise overlay and scanlines for visual effects
	// No JavaScript logic needed - CSS handles all styling
</script>

<!-- Noise overlay -->
<div class="noise-overlay"></div>

<!-- Scanlines -->
<div class="scanlines"></div>

<style>
	.noise-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9998;
		opacity: 0.03;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		background-repeat: repeat;
	}

	.scanlines {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9999;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0),
			rgba(255, 255, 255, 0) 50%,
			rgba(0, 0, 0, 0.1) 50%,
			rgba(0, 0, 0, 0.1)
		);
		background-size: 100% 4px;
		opacity: 0.1;
	}
</style>
