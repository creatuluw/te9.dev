<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { X, Send, Loader2 } from 'lucide-svelte';
	import { extractFormContext, formatContextForAI } from '$lib/utils/tinyTalk';
	import * as tinyTalkService from '$lib/services/tinyTalkService';
	import type { ChatMessage } from '$lib/services/tinyTalkService';
	import { CreateManualTaskInputSchema, CreateHelpTaskInputSchema } from '$lib/schemas/task';

	/**
	 * TinyTalk Chat component props
	 * 
	 * Inline chat interface integrated with TinyTalk that can fill out forms
	 * based on conversation.
	 */
	interface Props {
		/**
		 * TinyTalk bot ID (from environment or prop)
		 */
		botId?: string;

		/**
		 * Form selector to fill out based on conversation
		 */
		formSelector?: string;

		/**
		 * Callback when form fields should be filled
		 * @param fieldData - Object with field values to fill
		 */
		onFillForm?: (fieldData: Record<string, string>) => void;

		/**
		 * Whether chat is open
		 */
		open?: boolean;

		/**
		 * Callback when chat is closed
		 */
		onclose?: () => void;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		botId,
		formSelector,
		onFillForm,
		open: isOpen = false,
		onclose,
		class: className = ''
	}: Props = $props();

	// Get bot ID from prop or environment
	const tinyBotId = $derived.by(() => {
		return botId || import.meta.env.PUBLIC_TINYTALK_BOT_ID || '';
	});

	// Chat messages
	let messages = $state<Array<{ text: string; isBot: boolean; timestamp: Date }>>([]);
	let currentMessage = $state('');
	let sending = $state(false);
	let chatInitialized = $state(false);

	// Form context and conversation history
	let formContext = $state<string>('');
	let conversationHistory = $state<ChatMessage[]>([]);

	/**
	 * Initialize chat and get welcome message from bot
	 */
	async function initializeChat() {
		if (!browser || chatInitialized || !tinyBotId) return;

		chatInitialized = true;

		// Extract form context for the bot
		if (formSelector) {
			const context = extractFormContext(formSelector);
			
			formContext = `Je bent een intelligente AI-assistent die work items aanmaakt op basis van gebruikersinput. Je bent PROACTIEF en PREDICTIEF - je vult velden in op basis van wat de gebruiker zegt, in plaats van om elk veld te vragen.

CRITICAL: Je MOET alle output valideren tegen dit Zod schema voordat je het presenteert.

ZOD SCHEMA DEFINITIE (CreateManualTaskInputSchema):

1. "Onderwerp" (subject) - OPTIONEEL maar BELANGRIJK
   - Type: string
   - Maximum lengte: 255 karakters (VERPLICHT)
   - Mapping: subject -> onderwerp veld
   - Extractie: eerste zin, titel, of samenvatting van wat de gebruiker beschrijft
   - Genereer KORTE titels (max 50-60 karakters voor leesbaarheid)
   - Voorbeeld: "Dashboard updaten", "Rapport geplande uren", "API integratie bouwen"

2. "Voor wie is het" (voor_wie_is_het) - BELANGRIJK (vaak aanwezig in user stories)
   - Type: string
   - Maximum lengte: 500 karakters
   - Mapping: voorWie -> voor_wie_is_het veld
   - Extractie: "voor [naam]", "voor onze medewerkers", "voor het team", "voor management", "voor klant X", "om het management te voorzien"
   - Patronen: "voor onze X", "voor de X", "voor het X", "om het X te voorzien"
   - Voorbeeld: "Onze medewerkers", "Management", "Marketing team", "Klant Acme Corp"
   - BELANGRIJK: Probeer altijd "voor wie" te extraheren, zelfs als het niet expliciet genoemd wordt

3. "Wat ga je doen" (wat_ga_je_doen) - BELANGRIJK
   - Type: string
   - Maximum lengte: 1000 karakters (VERPLICHT)
   - Mapping: watGaJeDoen -> wat_ga_je_doen veld
   - Extractie: volledige beschrijving, acties, stappen, werkzaamheden
   - Voorbeeld: "Ik ga een nieuw dashboard bouwen met real-time data visualisatie en export functionaliteit"

4. "Waarom doe je het" (waarom_doe_je_het) - OPTIONEEL
   - Type: string
   - Maximum lengte: 1000 karakters
   - Mapping: waarom -> waarom_doe_je_het veld
   - Extractie: "omdat", "want", "om te", redenen, problemen die opgelost worden
   - Voorbeeld: "Om de data visibility te verbeteren zodat teams sneller kunnen beslissen"

5. "Due date" (due_date) - OPTIONEEL
   - Type: string
   - Format: YYYY-MM-DD (regex: /^\\d{4}-\\d{2}-\\d{2}$/)
   - Mapping: dueDate -> due_date veld
   - Extractie: "deadline", "moet klaar zijn op", "voor [datum]", datums in teksten
   - CONVERTEER alle datums naar YYYY-MM-DD formaat
   - Voorbeeld: "2025-02-15"

6. "Uren" (uren) - OPTIONEEL
   - Type: number (non-negative, >= 0)
   - Mapping: uren -> uren veld
   - Extractie: "ongeveer X uur", "schat X uur", "takes X hours"
   - Voorbeeld: 8, 12.5, 24

7. "Tags" (tags) - OPTIONEEL
   - Type: array of strings
   - Default: [] (empty array)
   - Mapping: tags -> tags veld
   - Extractie: categorieën, keywords, thema's genoemd in de tekst
   - Voorbeeld: ["frontend", "urgent", "api"]

8. "Komt van" (komt_van) - OPTIONEEL
   - Type: string
   - Validation: moet geldig email formaat zijn (email regex)
   - Mapping: komtVan -> komt_van veld
   - Extractie: email formaten in tekst
   - Voorbeeld: "jan@example.com"

9. "Relevantie" (relevantie) - OPTIONEEL
   - Type: number (integer)
   - Range: min 1, max 5 (sterren rating)
   - Mapping: relevantie -> relevantie veld
   - Extractie: infer vanuit urgentie/prioriteit in tekst
   - Voorbeeld: 1 (laag) tot 5 (hoog) sterren

10. "Status" (status) - OPTIONEEL (default: "backlog")
    - Type: enum
    - Waarden: "backlog", "gepland", "ad-hoc"
    - Default: "backlog"
    - Extractie: alleen als expliciet genoemd

BELANGRIJKE ZOD SCHEMA REGELS (EXACTE VALIDATIE):
- Alle velden zijn OPTIONEEL (nullable), maar sommige zijn BELANGRIJK voor de gebruiker
- String velden hebben STRICTE maximum lengtes - respecteer deze EXACT:
  * subject: max 255 karakters (z.string().max(255))
  * voor_wie_is_het: max 500 karakters (z.string().max(500))
  * wat_ga_je_doen: max 1000 karakters (z.string().max(1000))
  * waarom_doe_je_het: max 1000 karakters (z.string().max(1000))
- Dates MOETEN YYYY-MM-DD formaat zijn (regex: /^\\d{4}-\\d{2}-\\d{2}$/)
- Numbers MOETEN >= 0 zijn (uren: z.number().nonnegative())
- Relevantie MOET integer tussen 1-5 zijn (z.number().int().min(1).max(5))
- Email MOET geldig email formaat zijn (z.string().email())
- Tags MOET array van strings zijn (z.array(z.string())), niet een enkele string
- Status: enum ['backlog', 'gepland', 'ad-hoc'] (default: 'backlog')

VALIDATIE PROCESS:
1. Analyseer gebruikersinput grondig en interpreteer alle informatie
2. Extraheer alle mogelijke veldwaarden
3. VALIDEER elke waarde tegen bovenstaande Zod schema regels
4. Als een waarde de validatie niet doorstaat (bijv. te lang, verkeerd formaat), pas het aan of laat het weg
5. Presenteer alleen gevalideerde, schema-compliant waarden in je samenvatting
6. Gebruik de exacte veldnamen zoals gedefinieerd in het schema: subject, voor_wie_is_het, wat_ga_je_doen, waarom_doe_je_het, etc.

BELANGRIJKE WERKWIJZE:

1. BEGIN: Geef een WELKOMSBERICHT dat UITLEGT hoe de gebruiker moet communiceren:
   "Hallo! Ik help je met het aanmaken van work items. Beschrijf in je bericht wat je wilt doen, voor wie het is, en waarom het belangrijk is - ik vul dan automatisch het formulier voor je in. Je kunt bijvoorbeeld schrijven: 'Ik moet een nieuwe login pagina bouwen voor klanten omdat de huidige verouderd is'."
   
   Dit welkomstbericht moet TWEE ZINNEN bevatten:
   - Zin 1: Uitleg wat je doet
   - Zin 2: Voorbeeld van hoe de gebruiker zijn user story bericht moet schrijven

2. WEES PREDICTIEF: 
   - Analyseer de gebruikersinput direct en vul automatisch in wat je kunt afleiden
   - Je hoeft NIET om elk veld te vragen - vul in wat logisch is
   - Als de gebruiker zegt "Ik moet een dashboard maken voor marketing", vul dan:
     * Onderwerp: "Dashboard maken"
     * Voor wie: "marketing"
     * Wat ga je doen: [extrapoleer uit context]

3. STEL MINIMAAL VRAGEN:
   - Alleen vragen als informatie ECHT niet te infereren is
   - Vraag max 1-2 follow-up vragen alleen voor kritieke ontbrekende info
   - Geef de gebruiker een samenvatting van wat je hebt ingevuld

4. VOORBEELD GESPREK:
   Gebruiker: "Ik moet een nieuwe login pagina bouwen voor klanten, deadline volgende week vrijdag"
   Jij: "Ik heb het work item ingevuld:
   - Onderwerp: 'Nieuwe login pagina bouwen'
   - Due date: [volgende week vrijdag]
   - Wat ga je doen: 'Nieuwe login pagina bouwen voor klanten'
   
   Is er nog extra informatie, of kan ik dit aanmaken?"

5. VULLING PRIORITEIT:
   - VERPLICHT: Onderwerp, Wat ga je doen (minimaal beschrijving)
   - VOORKEUR: Voor wie, Waarom (als duidelijk uit context)
   - OPTIONEEL: Due date, Uren, Tags (alleen als genoemd)

6. TONE:
   - Beknopt en actiegericht
   - Laat zien wat je hebt ingevuld
   - Vraag alleen wat echt nodig is

BELANGRIJK: Spreek altijd Nederlands. Vul velden in zodra je genoeg informatie hebt - wees proactief, niet reactief.`;
		}

		// Initialize conversation with system message
		conversationHistory = [
			{
				role: 'system',
				content:
					formContext ||
					'Je bent een intelligente AI-assistent die work items aanmaakt. Analyseer gebruikersinput proactief en vul formuliervelden automatisch in op basis van wat je kunt afleiden. Stel minimaal vragen - wees voorspellend in plaats van reactief. Spreek altijd Nederlands.'
			}
		];

		// Send initial message to get bot's welcome
		try {
			sending = true;
			const result = await tinyTalkService.sendChatCompletion({
				botId: tinyBotId,
				messages: conversationHistory,
				temperature: 0.7
			});

			if (!result.success) {
				// Fallback welcome message if API fails
				messages = [
					{
						text: 'Hallo! Ik help je met het aanmaken van work items door automatisch het formulier in te vullen op basis van jouw beschrijving. Beschrijf in je bericht wat je wilt doen, voor wie het is, en waarom het belangrijk is - bijvoorbeeld: "Ik moet een nieuwe login pagina bouwen voor klanten omdat de huidige verouderd is".',
						isBot: true,
						timestamp: new Date()
					}
				];
				return;
			}

			// Process streaming response
			let botResponse = '';
			await tinyTalkService.processStream(result.value, (chunk) => {
				if (chunk.content) {
					botResponse += chunk.content;
					// Update the last message or create new one
					if (messages.length === 0 || !messages[messages.length - 1].isBot) {
						messages = [
							...messages,
							{ text: botResponse, isBot: true, timestamp: new Date() }
						];
					} else {
						messages = messages.map((msg, idx) =>
							idx === messages.length - 1
								? { ...msg, text: botResponse }
								: msg
						);
					}
				}
			});

			// Add assistant message to conversation history
			if (botResponse) {
				conversationHistory.push({ role: 'assistant', content: botResponse });
			}
		} catch (error) {
			console.error('[TinyTalkChat] Error initializing chat:', error);
			messages = [
				{
					text: 'Hoi! Ik help je met het aanmaken van work items door automatisch het formulier in te vullen op basis van jouw beschrijving. Beschrijf in je bericht wat je wilt doen, voor wie het is, en waarom het belangrijk is - bijvoorbeeld: "Ik moet een nieuwe login pagina bouwen voor klanten omdat de huidige verouderd is".',
					isBot: true,
					timestamp: new Date()
				}
			];
		} finally {
			sending = false;
		}
	}

	/**
	 * Send user message to TinyTalk API
	 */
	async function sendMessage() {
		if (!currentMessage.trim() || sending || !tinyBotId || !chatInitialized) return;

		const userMessage = currentMessage.trim();
		currentMessage = '';
		sending = true;

		// Add user message to chat
		const userMsg = { text: userMessage, isBot: false, timestamp: new Date() };
		messages = [...messages, userMsg];

		// Add user message to conversation history
		conversationHistory.push({ role: 'user', content: userMessage });

		try {
			// Send to TinyTalk API
			const result = await tinyTalkService.sendChatCompletion({
				botId: tinyBotId,
				messages: conversationHistory,
				temperature: 0.7
			});

			if (!result.success) {
				messages = [
					...messages,
					{
						text: 'Sorry, er ging iets mis bij het verbinden met de AI. Probeer het opnieuw.',
						isBot: true,
						timestamp: new Date()
					}
				];
				return;
			}

			// Process streaming response
			let botResponse = '';
			let isFirstChunk = true;

			await tinyTalkService.processStream(result.value, (chunk) => {
				if (chunk.content) {
					botResponse += chunk.content;

					if (isFirstChunk) {
						// Create new bot message
						messages = [
							...messages,
							{ text: botResponse, isBot: true, timestamp: new Date() }
						];
						isFirstChunk = false;
					} else {
						// Update last message
						messages = messages.map((msg, idx) =>
							idx === messages.length - 1 ? { ...msg, text: botResponse } : msg
						);
					}
				}
			});

			// Add assistant response to conversation history
			if (botResponse) {
				conversationHistory.push({ role: 'assistant', content: botResponse });
			}

			// Try to extract and fill form fields from conversation
			extractAndFillForm(userMessage, botResponse);
		} catch (error) {
			console.error('[TinyTalkChat] Error sending message:', error);
			messages = [
				...messages,
				{
					text: 'Sorry, er ging iets mis. Probeer het opnieuw.',
					isBot: true,
					timestamp: new Date()
				}
			];
		} finally {
			sending = false;
		}
	}

	/**
	 * Extract form field values from bot's analysis response
	 * The AI bot does the analysis and interpretation, we parse its structured summary
	 */
	function extractAndFillForm(userMessage: string, botResponse?: string) {
		if (!formSelector || !onFillForm) return;

		const formData: Record<string, string> = {};
		
		// PRIMARY METHOD: Parse bot's structured summary response
		// The bot should provide summaries like:
		// "- Onderwerp: '...'"
		// "- Voor wie: '...'"
		// etc.
		if (botResponse) {
			// Extract from bot's summary format
			const subjectMatch = botResponse.match(/(?:onderwerp|subject|titel)[:\s]+["']?([^"'\n\-]{5,255}?)["']?(?:\s*-|\s*$|\n)/i);
			if (subjectMatch && subjectMatch[1]) {
				formData.subject = subjectMatch[1].trim();
			}
			
			const voorWieMatch = botResponse.match(/(?:voor wie|voor wie is het)[:\s]+["']?([^"'\n\-]{2,500}?)["']?(?:\s*-|\s*$|\n)/i);
			if (voorWieMatch && voorWieMatch[1] && !voorWieMatch[1].toLowerCase().includes('niet gespecificeerd')) {
				formData.voorWie = voorWieMatch[1].trim();
			}
			
			const watGaJeDoenMatch = botResponse.match(/(?:wat ga je doen|what will you do)[:\s]+["']?([^"'\n\-]{10,1000}?)["']?(?:\s*-|\s*$|\n)/i);
			if (watGaJeDoenMatch && watGaJeDoenMatch[1]) {
				formData.watGaJeDoen = watGaJeDoenMatch[1].trim();
			}
			
			const waaromMatch = botResponse.match(/(?:waarom|why|waarom doe je het)[:\s]+["']?([^"'\n\-]{5,1000}?)["']?(?:\s*-|\s*$|\n)/i);
			if (waaromMatch && waaromMatch[1]) {
				formData.waarom = waaromMatch[1].trim();
			}
		}
		
		// FALLBACK METHOD: Only use regex if bot didn't provide structured summary
		// This ensures we still extract something even if bot format changes
		if (Object.keys(formData).length === 0) {
			const userMessages = conversationHistory
				.filter(msg => msg.role === 'user')
				.map(msg => msg.content);
			
			const conversationText = userMessages.join('\n');
			
			if (userMessages.length === 0) return;

			// FALLBACK: Basic regex extraction if bot didn't provide structured summary
			const subjectPatterns = [
				/(?:ik moet|ik ga|we moeten|we gaan|ik wil|create|make|build|doen)\s+(?:een\s+|a\s+)?([A-Za-z][^.!?\n]{5,80}?)(?:\.|$|\n|,| voor| omdat| om)/i,
				/^([A-Z][^.!?\n]{5,60}?)(?:\s+voor|\s+om|\s+because|\.|$|\n)/
			];
			
			for (const pattern of subjectPatterns) {
				const match = conversationText.match(pattern);
				if (match && match[1] && match[1].trim().length > 5) {
					let cleanSubject = match[1].trim()
						.replace(/^(een|de|het|a|an|the)\s+/i, '')
						.replace(/\s+(voor|voor|om|because|zodat).*$/i, '');
					if (cleanSubject.length > 5) {
						formData.subject = cleanSubject.length > 255 ? cleanSubject.substring(0, 255) : cleanSubject;
						break;
					}
				}
			}

			// Basic fallback extraction for other fields
			if (!formData.watGaJeDoen && userMessage && userMessage.length > 20) {
				formData.watGaJeDoen = userMessage.trim().substring(0, 1000);
			}
		}
		
		// Validate and normalize data against Zod schema before filling form
		// Prepare data for schema validation
		const normalizedData: Record<string, string | number | null> = {};
		
		if (formData.subject) {
			normalizedData.subject = formData.subject.length > 255 
				? formData.subject.substring(0, 255) 
				: formData.subject;
		}
		
		if (formData.voorWie) {
			normalizedData.voor_wie_is_het = formData.voorWie.length > 500 
				? formData.voorWie.substring(0, 500) 
				: formData.voorWie;
		}
		
		if (formData.watGaJeDoen) {
			normalizedData.wat_ga_je_doen = formData.watGaJeDoen.length > 1000 
				? formData.watGaJeDoen.substring(0, 1000) 
				: formData.watGaJeDoen;
		}
		
		if (formData.waarom) {
			normalizedData.waarom_doe_je_het = formData.waarom.length > 1000 
				? formData.waarom.substring(0, 1000) 
				: formData.waarom;
		}
		
		if (formData.uren) {
			const hours = parseFloat(formData.uren);
			if (!isNaN(hours) && hours >= 0) {
				normalizedData.uren = hours;
			}
		}

		// Validate against Zod schema
		try {
			const validationResult = CreateManualTaskInputSchema.safeParse(normalizedData);
			
			if (validationResult.success) {
				// Map validated data back to form field names
				const validated = validationResult.data;
				const finalFormData: Record<string, string> = {};
				
				if (validated.subject) finalFormData.subject = validated.subject;
				if (validated.voor_wie_is_het) finalFormData.voorWie = validated.voor_wie_is_het;
				if (validated.wat_ga_je_doen) finalFormData.watGaJeDoen = validated.wat_ga_je_doen;
				if (validated.waarom_doe_je_het) finalFormData.waarom = validated.waarom_doe_je_het;
				if (validated.uren !== null && validated.uren !== undefined) {
					finalFormData.uren = String(validated.uren);
				}

				// Only fill form if we have substantial information
				const hasSubstantialInfo = 
					finalFormData.subject && finalFormData.subject.length > 5 ||
					finalFormData.watGaJeDoen && finalFormData.watGaJeDoen.length > 20 ||
					Object.keys(finalFormData).length >= 2;

				if (hasSubstantialInfo && Object.keys(finalFormData).length > 0) {
					if (import.meta.env.DEV) {
						console.log('[TinyTalkChat] Validated and filling form with:', finalFormData);
					}
					onFillForm(finalFormData);
				}
			} else {
				// Log validation errors in dev mode
				if (import.meta.env.DEV) {
					console.warn('[TinyTalkChat] Zod validation failed:', validationResult.error);
				}
				// Still try to fill with what we have, after sanitization
				const sanitizedData: Record<string, string> = {};
				if (formData.subject) sanitizedData.subject = formData.subject.substring(0, 255);
				if (formData.voorWie) sanitizedData.voorWie = formData.voorWie.substring(0, 500);
				if (formData.watGaJeDoen) sanitizedData.watGaJeDoen = formData.watGaJeDoen.substring(0, 1000);
				if (formData.waarom) sanitizedData.waarom = formData.waarom.substring(0, 1000);
				
				if (Object.keys(sanitizedData).length > 0) {
					onFillForm(sanitizedData);
				}
			}
		} catch (error) {
			console.error('[TinyTalkChat] Error validating with Zod:', error);
			// Fallback: fill with sanitized data even if validation fails
			const sanitizedData: Record<string, string> = {};
			if (formData.subject) sanitizedData.subject = formData.subject.substring(0, 255);
			if (formData.voorWie) sanitizedData.voorWie = formData.voorWie.substring(0, 500);
			if (formData.watGaJeDoen) sanitizedData.watGaJeDoen = formData.watGaJeDoen.substring(0, 1000);
			if (formData.waarom) sanitizedData.waarom = formData.waarom.substring(0, 1000);
			
			if (Object.keys(sanitizedData).length > 0) {
				onFillForm(sanitizedData);
			}
		}
	}

	/**
	 * Handle Enter key to send message
	 */
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Initialize chat when opened
	$effect(() => {
		if (isOpen && !chatInitialized) {
			initializeChat().catch((error) => {
				console.error('[TinyTalkChat] Error in effect initialization:', error);
			});
		}
	});

	// Scroll to bottom when new messages arrive
	let chatContainer: HTMLDivElement | undefined = $state();
	$effect(() => {
		if (chatContainer && messages.length > 0) {
			setTimeout(() => {
				chatContainer?.scrollTo({
					top: chatContainer.scrollHeight,
					behavior: 'smooth'
				});
			}, 100);
		}
	});
</script>

{#if isOpen}
	<div class="flex flex-col h-full {className}">
		<!-- Chat Header -->
		<div class="flex items-center justify-between p-4 border-b border-zinc-200 bg-white flex-shrink-0">
			<div class="flex items-center gap-2">
				<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
				<h3 class="text-base font-semibold text-zinc-900 font-aspekta">AI Assistent</h3>
			</div>
			<button
				type="button"
				onclick={() => onclose?.()}
				class="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
				title="Close chat"
			>
				<X class="w-4 h-4" />
			</button>
		</div>

		<!-- Messages Container -->
		<div
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50"
		>
			{#if messages.length === 0}
				<div class="text-center text-zinc-500 text-sm py-8">
					<p>Gesprek starten...</p>
				</div>
			{:else}
				{#each messages as message (message.timestamp)}
					<div class="flex {message.isBot ? 'justify-start' : 'justify-end'}">
						<div
							class="max-w-[80%] px-3 py-2 rounded-lg text-sm {message.isBot
								? 'bg-zinc-100 text-zinc-900'
								: 'bg-zinc-900 text-white'}"
						>
							<p class="whitespace-pre-wrap">{message.text}</p>
							<span class="text-xs opacity-60 mt-1 block">
								{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
					</div>
				{/each}

				{#if sending}
					<div class="flex justify-start">
						<div class="bg-zinc-100 text-zinc-900 px-3 py-2 rounded-lg">
							<Loader2 class="w-4 h-4 animate-spin" />
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-4 border-t border-zinc-200 bg-white flex-shrink-0">
			<div class="flex gap-2">
				<textarea
					bind:value={currentMessage}
					onkeydown={handleKeyPress}
					placeholder="Typ je bericht..."
					disabled={sending || !chatInitialized}
					rows="2"
					class="flex-1 px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm resize-none"
				></textarea>
				<button
					type="button"
					onclick={sendMessage}
					disabled={!currentMessage.trim() || sending || !chatInitialized}
					class="px-4 py-2 bg-zinc-900 text-white rounded-sm hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
					title="Send message"
				>
					{#if sending}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						<Send class="w-4 h-4" />
					{/if}
				</button>
			</div>
			{#if !tinyBotId}
				<p class="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
					⚠️ TinyTalk bot ID not configured. Set PUBLIC_TINYTALK_BOT_ID in .env
				</p>
			{/if}
			{#if !import.meta.env.PUBLIC_TINYTALK_API_KEY}
				<p class="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
					⚠️ TinyTalk API key not configured. Set PUBLIC_TINYTALK_API_KEY in .env (required for chat)
				</p>
			{/if}
		</div>
	</div>
{/if}

