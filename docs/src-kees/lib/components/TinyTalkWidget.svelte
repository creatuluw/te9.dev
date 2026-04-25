<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	/**
	 * TinyTalk Widget component props
	 * 
	 * Embeds TinyTalk chatbot widget into forms to provide AI assistance
	 * for filling out form fields with contextual help.
	 */
	interface Props {
		/**
		 * TinyTalk bot ID (from environment or prop)
		 * If not provided, will try to read from PUBLIC_TINYTALK_BOT_ID
		 */
		botId?: string;

		/**
		 * Additional context/notes to provide to the AI
		 * This helps the AI understand what to fill in the form
		 */
		context?: string;

		/**
		 * Form ID or form element selector
		 * Used to extract form field information for context
		 */
		formSelector?: string;

		/**
		 * Position of the widget
		 * @default 'bottom-right'
		 */
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		botId,
		context = '',
		formSelector,
		position = 'bottom-right',
		class: className = ''
	}: Props = $props();

	let scriptLoaded = $state(false);
	let widgetInitialized = $state(false);

	// Get bot ID from prop or environment
	const tinyBotId = $derived.by(() => {
		return botId || import.meta.env.PUBLIC_TINYTALK_BOT_ID || '';
	});

	/**
	 * Extract form field metadata for AI context
	 */
	function getFormContext(): string {
		let formInfo = '';

		if (formSelector && browser) {
			const form = document.querySelector(formSelector);
			if (form) {
				const fields: string[] = [];

				// Get all input fields
				const inputs = form.querySelectorAll('input, textarea, select');
				inputs.forEach((input) => {
					const element = input as HTMLElement;
					const id = element.id || '';
					const name = (element as HTMLInputElement).name || '';
					const type = (element as HTMLInputElement).type || 'text';
					const label = element.getAttribute('aria-label') || 
						(form.querySelector(`label[for="${id}"]`)?.textContent?.trim() || '');
					const placeholder = (element as HTMLInputElement).placeholder || '';
					const value = (element as HTMLInputElement).value || '';

					if (label || id || name) {
						fields.push(
							`- ${label || id || name}: ${placeholder ? `(${placeholder})` : ''} ${value ? `[Current: ${value}]` : ''}`
						);
					}
				});

				if (fields.length > 0) {
					formInfo = `\n\nForm Fields:\n${fields.join('\n')}`;
				}
			}
		}

		const userContext = context ? `\n\nUser Notes/Context:\n${context}` : '';

		return `You are helping to fill out a form. ${formInfo}${userContext}`;
	}

	/**
	 * Load TinyTalk SDK script
	 */
	function loadTinyTalkScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!browser) {
				resolve();
				return;
			}

			// Check if script is already loaded
			const existingScript = document.querySelector('script[data-tiny-bot-id]');
			if (existingScript) {
				scriptLoaded = true;
				resolve();
				return;
			}

			// Check if bot ID is configured
			if (!tinyBotId) {
				console.warn('[TinyTalkWidget] Bot ID not configured. Set PUBLIC_TINYTALK_BOT_ID in .env');
				resolve(); // Resolve anyway to avoid blocking
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://cdn.tinytalk.ai/latest/tiny-talk-sdk.min.umd.js';
			script.setAttribute('data-tiny-bot-id', tinyBotId);
			script.defer = true;

			script.onload = () => {
				scriptLoaded = true;
				resolve();
			};

			script.onerror = () => {
				console.error('[TinyTalkWidget] Failed to load TinyTalk SDK');
				reject(new Error('Failed to load TinyTalk SDK'));
			};

			document.head.appendChild(script);
		});
	}

	/**
	 * Initialize TinyTalk widget
	 */
	function initializeWidget() {
		if (!browser || !tinyBotId || widgetInitialized) return;

		try {
			// TinyTalk widget should auto-initialize when script loads
			// We can optionally pass context via data attributes or message API
			widgetInitialized = true;

			if (import.meta.env.DEV) {
				console.log('[TinyTalkWidget] Widget initialized for bot:', tinyBotId);
			}
		} catch (error) {
			console.error('[TinyTalkWidget] Error initializing widget:', error);
		}
	}

	onMount(async () => {
		if (!browser) return;

		if (tinyBotId) {
			await loadTinyTalkScript();
			initializeWidget();
		} else {
			console.warn(
				'[TinyTalkWidget] Bot ID not configured. Please set PUBLIC_TINYTALK_BOT_ID in your .env file'
			);
		}
	});

	onDestroy(() => {
		// Widget cleanup is handled by TinyTalk SDK
		if (import.meta.env.DEV) {
			console.log('[TinyTalkWidget] Component destroyed');
		}
	});
</script>

<!-- TinyTalk widget will be injected by the SDK script -->
<!-- You can customize the widget appearance via TinyTalk dashboard settings -->

{#if !tinyBotId}
	<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-sm text-yellow-700 text-sm {className}">
		<p class="font-medium mb-1">TinyTalk niet geconfigureerd</p>
		<p class="text-xs">
			Voeg <code class="bg-yellow-100 px-1 rounded">PUBLIC_TINYTALK_BOT_ID</code> toe aan je .env bestand om de AI assistent te gebruiken.
		</p>
	</div>
{/if}

<style>
	/* Custom TinyTalk widget positioning */
	:global(.tiny-talk-widget) {
		position: fixed;
		z-index: 9999;
	}

	:global(.tiny-talk-widget[data-position="bottom-right"]) {
		bottom: 20px;
		right: 20px;
	}

	:global(.tiny-talk-widget[data-position="bottom-left"]) {
		bottom: 20px;
		left: 20px;
	}

	:global(.tiny-talk-widget[data-position="top-right"]) {
		top: 20px;
		right: 20px;
	}

	:global(.tiny-talk-widget[data-position="top-left"]) {
		top: 20px;
		left: 20px;
	}
</style>

