<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/Header.svelte';
	import ThreeBackground from '$lib/components/ThreeBackground.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let statusFilter = $state('');
	
	let filteredDrafts = $derived(() => {
		let result = data.drafts;
		if (statusFilter) {
			result = result.filter(d => d.status === statusFilter);
		}
		return result;
	});
	
	let pending = $derived(data.drafts.filter(d => d.status === 'pending'));
	let approved = $derived(data.drafts.filter(d => d.status === 'approved'));
	let rejected = $derived(data.drafts.filter(d => d.status === 'rejected'));
	
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Drafts | te9-archives</title>
</svelte:head>

{#if data.error}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
			<p class="text-zinc-500">{data.error}</p>
		</div>
	</div>
{:else}
	<Header />
	<ThreeBackground />

	<main class="pt-16 flex-1 flex flex-col">
		<section class="flex-1 flex flex-col">
			<div class="max-w-[2560px] mx-auto w-full">
				<div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b">
					<div class="flex flex-wrap gap-4 items-center">
						<h1 class="text-xl font-semibold text-zinc-900">Drafts</h1>
						
						<div class="flex-1"></div>
						
						<a href="/bookmarks?key={data.apiKey}" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
							Bookmarks
						</a>
					</div>
				</div>
				
				<div class="border-x border-zinc-200 bg-white/60 backdrop-blur-sm px-6 py-3 border-b">
					<div class="flex gap-2">
						<button 
							onclick={() => statusFilter = ''}
							class="px-3 py-1.5 rounded-lg text-sm transition-colors {statusFilter === '' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}"
						>
							All ({data.drafts.length})
						</button>
						<button 
							onclick={() => statusFilter = 'pending'}
							class="px-3 py-1.5 rounded-lg text-sm transition-colors {statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}"
						>
							Pending ({pending.length})
						</button>
						<button 
							onclick={() => statusFilter = 'approved'}
							class="px-3 py-1.5 rounded-lg text-sm transition-colors {statusFilter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
						>
							Approved ({approved.length})
						</button>
						<button 
							onclick={() => statusFilter = 'rejected'}
							class="px-3 py-1.5 rounded-lg text-sm transition-colors {statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}"
						>
							Rejected ({rejected.length})
						</button>
					</div>
				</div>
				
				{#if filteredDrafts().length === 0}
					<div class="text-center py-24 text-zinc-400">
						<p>No drafts found</p>
					</div>
				{:else}
					<div class="grid border-x border-zinc-200" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr))">
						{#each filteredDrafts() as draft}
							{@const bookmark = data.bookmarkMap?.[draft.bookmark_id]}
							<a 
								href="/drafts/{draft.id}?key={data.apiKey}"
								class="block border-b border-r border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group"
							>
								<article class="p-5 flex flex-col h-full">
									<div class="flex items-start justify-between mb-2">
										<span class="text-xs font-medium px-2 py-0.5 rounded-full {
											draft.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
											draft.status === 'rejected' ? 'bg-red-100 text-red-700' :
											'bg-amber-100 text-amber-700'
										}">
											{draft.status}
										</span>
										<span class="text-xs text-zinc-400">
											{formatDate(draft.created_at)}
										</span>
									</div>
									
									<h3 class="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2 mb-2">
										{draft.title}
									</h3>
									
									{#if bookmark}
										<p class="text-sm text-zinc-500 mb-2">
											From: {bookmark.title}
										</p>
									{/if}
									
									{#if draft.feedback}
										<p class="text-sm text-red-500 line-clamp-1 mt-auto">
											Feedback: {draft.feedback}
										</p>
									{/if}
								</article>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</main>
{/if}
