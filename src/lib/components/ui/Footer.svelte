<script lang="ts">
	// Footer.svelte - Site footer component
	// Displays brand, navigation links, and status indicator
</script>

<footer class="site-footer">
	<div class="footer-content">
		<div class="footer-main">
			<div class="footer-brand">
				<span class="footer-logo">te9.dev</span>
				<p class="footer-tagline">Patrick's Digital Garden</p>
			</div>
			<div class="footer-links">
				<div class="footer-col">
					<h4>Connect</h4>
					<a href="mailto:creatuluw@gmail.com">Email</a>
					<a
						href="https://linkedin.com/in/gotoptw"
						target="_blank"
						rel="noopener noreferrer">LinkedIn</a
					>
					<a
						href="https://bsky.app/profile/creatuluw.bsky.social"
						target="_blank"
						rel="noopener noreferrer">Bluesky</a
					>
				</div>
				<div class="footer-col">
					<h4>Sites</h4>
					<a
						href="https://patrick.te9.nl"
						target="_blank"
						rel="noopener noreferrer">patrick.te9.nl</a
					>
					<a
						href="https://github.com/creatuluw"
						target="_blank"
						rel="noopener noreferrer">GitHub</a
					>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<span class="footer-copy">© 2025 Patrick Tehubijuluw</span>
			<span class="footer-status">
				<span class="status-dot"></span>
				Growing organically
			</span>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background: linear-gradient(to bottom, #111111, #0a0a0a);
		padding: 3rem 2rem 2rem;
		border-top: 1px solid #2a2a2a;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.footer-main {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.footer-main {
			flex-direction: column;
			gap: 2rem;
		}
	}

	.footer-brand {
		flex-shrink: 0;
	}

	.footer-logo {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.5rem;
		font-weight: 700;
		color: #ff9500;
		display: block;
		margin-bottom: 0.5rem;
	}

	.footer-tagline {
		font-size: 0.875rem;
		color: #888888;
		margin: 0;
	}

	.footer-links {
		display: flex;
		gap: 4rem;
	}

	@media (max-width: 500px) {
		.footer-links {
			flex-direction: column;
			gap: 2rem;
		}
	}

	.footer-col h4 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #e8e8e8;
		margin-bottom: 1rem;
	}

	.footer-col a {
		display: block;
		font-size: 0.875rem;
		color: #888888;
		text-decoration: none;
		margin-bottom: 0.5rem;
		transition: color 0.3s ease;
	}

	.footer-col a:hover {
		color: #ff9500;
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 2rem;
		border-top: 1px solid #2a2a2a;
		font-size: 0.875rem;
		color: #666666;
	}

	@media (max-width: 500px) {
		.footer-bottom {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
	}

	.footer-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		background: #4ade80;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.95);
		}
	}
</style>
