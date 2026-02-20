<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ThreeBackground from '$lib/components/ThreeBackground.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let draft = $state(data.draft);
	let content = $state(draft.content);
	let feedback = $state(draft.feedback || '');
	let viewMode = $state<'edit' | 'preview' | 'published'>('preview');
	
	let saving = $state(false);
	let publishing = $state(false);
	let message = $state('');
	let isStreaming = $state(false);
	
	let renderedContent = $derived(marked(content) as string);
	
	function stripFrontmatter(text: string): string {
		if (!text.startsWith('---')) return text;
		const endMarker = text.indexOf('\n---', 4);
		if (endMarker === -1) return text;
		return text.slice(endMarker + 4).trimStart();
	}
	
	let contentWithoutFrontmatter = $derived(stripFrontmatter(content));
	let publishedContent = $derived(marked(contentWithoutFrontmatter) as string);
	
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get('stream') === 'true' && !content) {
			startStreaming();
		}
	});
	
	async function startStreaming() {
		isStreaming = true;
		message = 'Generating blog post...';
		
		try {
			const res = await fetch(`/api/drafts/${draft.id}/stream?key=${data.apiKey}`, {
				method: 'POST'
			});
			
			if (!res.ok) {
				const err = await res.json();
				message = err.error || 'Generation failed';
				isStreaming = false;
				return;
			}
			
			const reader = res.body?.getReader();
			if (!reader) {
				message = 'No response stream';
				isStreaming = false;
				return;
			}
			
			const decoder = new TextDecoder();
			
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				
				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');
				
				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						try {
							const parsed = JSON.parse(data);
							if (parsed.done) {
								message = 'Blog post generated!';
								if (parsed.title) {
									draft = { ...draft, title: parsed.title };
								}
								window.history.replaceState({}, '', window.location.pathname + '?key=' + new URLSearchParams(window.location.search).get('key'));
							} else if (parsed.content) {
								content += parsed.content;
							} else if (parsed.fullContent) {
								content = parsed.fullContent;
							}
						} catch {
							// Skip invalid JSON
						}
					}
				}
			}
		} catch (e) {
			console.error('Streaming error:', e);
			message = 'Error generating blog post';
		}
		
		isStreaming = false;
	}
	
	async function saveChanges() {
		saving = true;
		message = '';
		
		try {
			const res = await fetch(`/api/drafts/${draft.id}?key=${data.apiKey}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, title: draft.title })
			});
			
			if (res.ok) {
				draft = await res.json();
				message = 'Saved!';
			} else {
				message = 'Failed to save';
			}
		} catch {
			message = 'Error saving';
		}
		
		saving = false;
	}
	
	async function approve() {
		saving = true;
		
		try {
			const res = await fetch(`/api/drafts/${draft.id}?key=${data.apiKey}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'approved' })
			});
			
			if (res.ok) {
				draft = await res.json();
				message = 'Approved!';
			}
		} catch {
			message = 'Error';
		}
		
		saving = false;
	}
	
	async function reject() {
		if (!feedback.trim()) {
			message = 'Please provide feedback';
			return;
		}
		
		saving = true;
		
		try {
			const res = await fetch(`/api/drafts/${draft.id}?key=${data.apiKey}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'rejected', feedback })
			});
			
			if (res.ok) {
				draft = await res.json();
				message = 'Rejected with feedback';
			}
		} catch {
			message = 'Error';
		}
		
		saving = false;
	}
	
	async function publish() {
		if (draft.status !== 'approved') {
			message = 'Must be approved first';
			return;
		}
		
		if (!confirm('Publish this draft to the blog? This will create a new blog post.')) {
			return;
		}
		
		publishing = true;
		
		try {
			const res = await fetch(`/api/drafts/${draft.id}/publish?key=${data.apiKey}`, {
				method: 'POST'
			});
			
			if (res.ok) {
				message = 'Published! Redirecting...';
				setTimeout(() => {
					window.location.href = `/drafts?key=${data.apiKey}`;
				}, 1500);
			} else {
				const err = await res.json();
				message = err.error || 'Failed to publish';
			}
		} catch {
			message = 'Error publishing';
		}
		
		publishing = false;
	}
	
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{draft.title} | Drafts</title>
</svelte:head>

<Header />
<ThreeBackground />

<main class="pt-16 flex-1 flex flex-col">
	<section class="flex-1 flex flex-col">
		<div class="max-w-[2560px] mx-auto w-full">
			<div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b">
				<div class="flex items-center justify-between">
					<a href="/drafts?key={data.apiKey}" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
						← Back to Drafts
					</a>
					<div class="flex items-center gap-3">
						{#if isStreaming}
							<span class="flex items-center gap-2 text-sm text-emerald-600">
								<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Generating...
							</span>
						{/if}
						<span class="px-3 py-1 rounded-full text-xs font-medium {
							draft.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
							draft.status === 'rejected' ? 'bg-red-100 text-red-700' :
							'bg-amber-100 text-amber-700'
						}">
							{draft.status}
						</span>
					</div>
				</div>
			</div>
			
			<div class="border-x border-zinc-200 p-6 lg:p-8">
				<div class="max-w-4xl mx-auto">
					<div class="mb-8">
						<h1 class="text-2xl font-semibold text-zinc-900 mb-2">{draft.title}</h1>
						<p class="text-zinc-500 text-sm">
							Slug: <code class="bg-zinc-100 px-2 py-1 rounded text-zinc-600">{draft.slug}</code>
						</p>
						{#if data.bookmark}
							<p class="text-zinc-500 text-sm mt-2">
								From bookmark: <a 
									href="/bookmarks/{data.bookmark.id}?key={data.apiKey}" 
									class="text-zinc-900 hover:text-zinc-600 underline"
								>
									{data.bookmark.title}
								</a>
							</p>
						{/if}
					</div>
					
					{#if isStreaming && !content}
						<div class="bg-white border border-zinc-200 rounded-xl p-12 shadow-sm">
							<div class="text-center">
								<svg class="animate-spin h-12 w-12 mx-auto mb-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<p class="text-zinc-500 font-medium">Generating your blog post...</p>
								<p class="text-zinc-400 text-sm mt-2">This may take a moment</p>
							</div>
						</div>
					{:else}
						<div class="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
							<div class="flex border-b border-zinc-200">
								<button 
									onclick={() => viewMode = 'preview'}
									class="px-6 py-3 text-sm font-medium transition-colors {viewMode === 'preview' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}"
								>
									Preview
								</button>
								<button 
									onclick={() => viewMode = 'published'}
									class="px-6 py-3 text-sm font-medium transition-colors {viewMode === 'published' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}"
								>
									Published View
								</button>
								<button 
									onclick={() => viewMode = 'edit'}
									class="px-6 py-3 text-sm font-medium transition-colors {viewMode === 'edit' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}"
								>
									Edit Markdown
								</button>
							</div>
							
							{#if viewMode === 'preview'}
								<div class="p-6 lg:p-8 prose max-w-none">
									{#if content}
										{@html renderedContent}
									{:else}
										<p class="text-zinc-400 italic">No content yet</p>
									{/if}
								</div>
							{:else if viewMode === 'published'}
								<article class="py-12 px-6 lg:px-8 prose">
									{#if contentWithoutFrontmatter}
										{@html publishedContent}
									{:else}
										<p class="text-zinc-400 italic">No content yet</p>
									{/if}
								</article>
							{:else}
								<textarea 
									bind:value={content}
									rows={25}
									class="w-full bg-zinc-50 p-6 font-mono text-sm text-zinc-700 focus:outline-none border-0"
									placeholder="Markdown content..."
								></textarea>
							{/if}
						</div>
					{/if}
					
					{#if draft.status === 'pending'}
						<div class="mt-6 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
							<h3 class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Review Feedback</h3>
							<textarea 
								bind:value={feedback}
								rows={3}
								placeholder="Add feedback if requesting changes..."
								class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
							></textarea>
						</div>
					{/if}
					
					{#if draft.status === 'rejected' && draft.feedback}
						<div class="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
							<h3 class="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Feedback</h3>
							<p class="text-red-600">{draft.feedback}</p>
						</div>
					{/if}
					
					<div class="flex flex-wrap gap-4 mt-8 pt-6 border-t border-zinc-200">
						{#if viewMode === 'edit' && !isStreaming}
							<button 
								onclick={saveChanges}
								disabled={saving}
								class="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						{/if}
						
						{#if draft.status === 'pending' && !isStreaming}
							<button 
								onclick={approve}
								disabled={saving}
								class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
							>
								Approve
							</button>
							<button 
								onclick={reject}
								disabled={saving || !feedback.trim()}
								class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
							>
								Request Changes
							</button>
						{/if}
						
						{#if draft.status === 'approved' && !isStreaming}
							<button 
								onclick={publish}
								disabled={publishing}
								class="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
							>
								{publishing ? 'Publishing...' : 'Publish to Blog'}
							</button>
						{/if}
						
						{#if message}
							<span class="text-sm text-zinc-500 self-center">{message}</span>
						{/if}
					</div>
					
					<div class="mt-8 text-sm text-zinc-400">
						<p>Created: {formatDate(draft.created_at)}</p>
						<p>Updated: {formatDate(draft.updated_at)}</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
