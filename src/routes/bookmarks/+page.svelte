<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ThreeBackground from '$lib/components/ThreeBackground.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let selectedCategory = $state('');
	let syncing = $state(false);
	let syncProgress = $state(0);
	let syncMessage = $state('');
	let showAuthModal = $state(false);
	let authUrl = $state('');
	let isCheckingAuth = $state(true);
	let isAuthenticated = $state(false);
	let showSyncModal = $state(false);
	let syncDays = $state(90);
	
	let bookmarks = $state(data.bookmarks);
	let categories = $state(data.categories);
	let raindropTotal = $state(data.raindropTotal);
	
	let remainingToSync = $derived(raindropTotal - bookmarks.length);
	
	let filteredBookmarks = $derived(() => {
		let result = bookmarks;
		if (selectedCategory) {
			result = result.filter(b => b.category === selectedCategory);
		}
		return result;
	});
	
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function truncate(text: string, length: number): string {
		if (!text) return '';
		return text.length > length ? text.slice(0, length) + '...' : text;
	}
	
	async function checkAuthStatus() {
		isCheckingAuth = true;
		try {
			const res = await fetch(`/api/auth/raindrop/status?key=${data.apiKey}`);
			const status = await res.json();
			isAuthenticated = status.authenticated;
			authUrl = status.authUrl;
			
			if (status.authenticated && typeof window !== 'undefined') {
				localStorage.setItem('raindrop_authenticated', 'true');
			}
		} catch (e) {
			console.error('Failed to check auth status', e);
		}
		isCheckingAuth = false;
	}
	
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('auth') === 'success') {
			syncMessage = 'Successfully connected to Raindrop!';
			isAuthenticated = true;
			if (typeof window !== 'undefined') {
				localStorage.setItem('raindrop_authenticated', 'true');
			}
			window.history.replaceState({}, '', window.location.pathname + '?key=' + data.apiKey);
			checkAuthStatus();
		} else {
			checkAuthStatus();
		}
	});
	
	function openAuthModal() {
		showAuthModal = true;
	}
	
	function startOAuthFlow() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('raindrop_authenticated', 'true');
		}
		window.location.href = authUrl;
	}
	
	function openSyncModal() {
		if (!isAuthenticated) {
			showAuthModal = true;
			return;
		}
		showSyncModal = true;
	}
	
	async function handleSync(days = 90) {
		showSyncModal = false;
		syncing = true;
		syncProgress = 10;
		syncMessage = `Syncing bookmarks from last ${days} days...`;
		
		try {
			syncProgress = 30;
			
			const res = await fetch(`/api/sync?key=${data.apiKey}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: 500, days })
			});
			
			syncProgress = 70;
			
			const result = await res.json();
			
			if (result.success) {
				syncProgress = 90;
				
				const [bookmarksRes, categoriesRes] = await Promise.all([
					fetch(`/api/bookmarks?key=${data.apiKey}&days=365${selectedCategory ? '&category=' + selectedCategory : ''}`),
					fetch(`/api/categories?key=${data.apiKey}`)
				]);
				
				bookmarks = await bookmarksRes.json();
				categories = await categoriesRes.json();
				raindropTotal = result.total;
				
				syncProgress = 100;
				syncMessage = `Done! ${result.added} added, ${result.updated} updated`;
			} else {
				if (result.error === 'NO_REFRESH_TOKEN') {
					showAuthModal = true;
				} else if (result.error === 'RATE_LIMITED') {
					syncMessage = 'Rate limited. Please wait a minute and try again.';
				} else {
					syncMessage = result.error || 'Sync failed';
				}
			}
		} catch (e) {
			syncMessage = 'Sync failed';
			console.error(e);
		}
		
		syncing = false;
	}
</script>

<svelte:head>
	<title>Bookmarks | te9-archives</title>
</svelte:head>

{#if data.error}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
			<p class="text-zinc-500">{data.error}</p>
			<p class="text-zinc-400 mt-2 text-sm">Add ?key=YOUR_API_KEY to the URL</p>
		</div>
	</div>
{:else}
	<Header />
	<ThreeBackground />

	{#if showAuthModal}
		<div class="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 border border-zinc-200 shadow-xl">
				<h2 class="text-xl font-bold text-zinc-900 mb-4">Connect to Raindrop.io</h2>
				<p class="text-zinc-500 mb-6">
					To sync your bookmarks, you need to authorize access to your Raindrop.io account.
				</p>
				<div class="flex gap-3">
					<button 
						onclick={startOAuthFlow}
						class="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Authorize Raindrop
					</button>
					<button 
						onclick={() => showAuthModal = false}
						class="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
					>
						Cancel
					</button>
				</div>
				<p class="text-zinc-400 text-xs mt-4 text-center">
					Your credentials are stored securely in the database
				</p>
			</div>
		</div>
	{/if}

	{#if showSyncModal}
		<div class="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white rounded-xl p-8 max-w-sm w-full mx-4 border border-zinc-200 shadow-xl">
				<h2 class="text-xl font-bold text-zinc-900 mb-2">Sync Bookmarks</h2>
				<p class="text-zinc-500 mb-6">
					Sync bookmarks created or modified in the last N days.
				</p>
				<div class="mb-6">
					<label for="syncDays" class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Days to sync back</label>
					<input 
						id="syncDays"
						type="number" 
						bind:value={syncDays}
						min="1"
						max="3650"
						class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
					/>
					<p class="text-xs text-zinc-400 mt-2">
						Default: 90 days. Max: 3650 (10 years).
					</p>
				</div>
				<div class="flex gap-3">
					<button 
						onclick={() => handleSync(syncDays)}
						class="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium text-sm transition-colors"
					>
						Sync Now
					</button>
					<button 
						onclick={() => showSyncModal = false}
						class="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<main class="pt-16 flex-1 flex flex-col">
		<section class="flex-1 flex flex-col">
			<div class="max-w-[2560px] mx-auto w-full">
				<div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b">
					<div class="flex flex-wrap gap-4 items-center">
						<h1 class="text-xl font-semibold text-zinc-900">Bookmarks</h1>
						
						{#if isAuthenticated}
							<span class="text-xs text-emerald-600 flex items-center gap-1">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								Connected
							</span>
						{/if}
						
						<div class="flex-1"></div>
						
						{#if isAuthenticated}
							<button 
								onclick={openSyncModal}
								disabled={syncing}
								class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
							>
								{#if syncing}
									<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Syncing...
								{:else}
									<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
									Sync
								{/if}
							</button>
						{:else if !isCheckingAuth}
							<button 
								onclick={openAuthModal}
								class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
								</svg>
								Connect
							</button>
						{/if}
						
						{#if syncing}
							<div class="w-32">
								<div class="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
									<div 
										class="h-full bg-zinc-900 transition-all duration-300 ease-out"
										style="width: {syncProgress}%"
									></div>
								</div>
								<p class="text-xs text-zinc-400 mt-1 truncate">{syncMessage}</p>
							</div>
						{:else if syncMessage}
							<span class="text-sm text-zinc-500">{syncMessage}</span>
						{/if}
						
						<select 
							bind:value={selectedCategory}
							class="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
						>
							<option value="">All Categories</option>
							{#each categories as cat}
								<option value={cat.name}>{cat.name}</option>
							{/each}
						</select>
						
						<a href="/drafts?key={data.apiKey}" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
							Drafts
						</a>
					</div>
				</div>
				
				{#if syncing}
					<div class="text-center py-24 text-zinc-400">
						<svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<p>Syncing bookmarks from Raindrop...</p>
					</div>
				{:else if filteredBookmarks().length === 0}
					<div class="text-center py-24 text-zinc-400">
						<p>No bookmarks found</p>
						<p class="text-sm mt-2">Click "Sync" to import your bookmarks</p>
					</div>
				{:else}
					<div class="grid border-x border-zinc-200" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
						{#each filteredBookmarks() as bookmark}
							<a 
								href="/bookmarks/{bookmark.id}?key={data.apiKey}"
								class="block border-b border-r border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group"
							>
								<article class="p-5 flex flex-col h-full">
									<div class="flex items-start justify-between mb-2">
										<span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">
											{bookmark.category}
										</span>
										{#if bookmark.blog_approved}
											<span class="text-xs text-emerald-600">
												Approved
											</span>
										{/if}
									</div>
									
									<h3 class="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2 mb-2">
										{bookmark.title}
									</h3>
									
									{#if bookmark.excerpt}
										<p class="text-zinc-500 text-sm font-light leading-relaxed line-clamp-2 mb-3 flex-1">
											{truncate(bookmark.excerpt, 120)}
										</p>
									{/if}
									
									<div class="flex items-center justify-between text-xs text-zinc-400 mt-auto">
										<span class="truncate max-w-[150px]">{bookmark.domain}</span>
										<span>{formatDate(bookmark.created_at)}</span>
									</div>
									
									{#if bookmark.tags && bookmark.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-3">
											{#each bookmark.tags.slice(0, 3) as tag}
												<span class="px-2 py-0.5 text-xs bg-zinc-100 rounded text-zinc-500">
													{tag}
												</span>
											{/each}
										</div>
									{/if}
								</article>
							</a>
						{/each}
						
						{#if remainingToSync > 0 && !selectedCategory}
							<button 
								onclick={openSyncModal}
								disabled={syncing}
								class="block border-b border-r border-zinc-200 hover:bg-zinc-900 hover:border-zinc-900 transition-colors duration-200 group cursor-pointer"
							>
								<article class="p-5 flex flex-col h-full items-center justify-center text-center min-h-[200px]">
									<div class="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-white flex items-center justify-center mb-4 transition-colors">
										<svg class="w-6 h-6 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</div>
									<span class="text-sm font-medium text-zinc-900 group-hover:text-white transition-colors">
										Sync more bookmarks
									</span>
									<span class="text-xs text-zinc-400 group-hover:text-zinc-300 mt-1 transition-colors">
										{remainingToSync} remaining
									</span>
								</article>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	</main>
{/if}
