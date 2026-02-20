<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/Header.svelte';
	import ThreeBackground from '$lib/components/ThreeBackground.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let bookmark = $state(data.bookmark);
	let categories = $state(data.categories);
	let drafts = $state(data.drafts);
	let skillDraft = $state(data.skillDraft);
	
	let title = $state(bookmark.title);
	let category = $state(bookmark.category);
	let reason = $state(bookmark.reason_for_bookmark || '');
	let blogApproved = $state(bookmark.blog_approved);
	let tags = $state(bookmark.tags?.join(', ') || '');
	let showNewCategoryInput = $state(false);
	
	let saving = $state(false);
	let generating = $state(false);
	let message = $state('');
	let showApprovalModal = $state(false);
	let pendingApproval = $state<boolean | null>(null);
	
	let showGenerateModal = $state(false);
	let generateDraftType = $state<'blog_post' | 'skill'>('blog_post');
	let customTitle = $state('');
	let repurposingGoals = $state('');
	let webResearchEnabled = $state(true);
	let suggestingGoals = $state(false);
	let suggestedGoals = $state<string[]>([]);
	let selectedGoals = $state<boolean[]>([]);
	
	let showDeleteModal = $state(false);
	let draftToDelete = $state<{ id: number; title: string } | null>(null);
	
	async function saveChanges() {
		saving = true;
		message = '';
		
		try {
			const res = await fetch(`/api/bookmarks/${bookmark.id}?key=${data.apiKey}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					category,
					reason_for_bookmark: reason || null,
					blog_approved: blogApproved,
					tags: tags.split(',').map(t => t.trim()).filter(Boolean)
				})
			});
			
			if (res.ok) {
				const updated = await res.json();
				bookmark = updated;
				message = 'Saved!';
			} else {
				message = 'Failed to save';
			}
		} catch {
			message = 'Error saving';
		}
		
		saving = false;
	}
	
	function openGenerateModal() {
		customTitle = '';
		repurposingGoals = '';
		suggestedGoals = [];
		selectedGoals = [];
		generateDraftType = 'blog_post';
		showGenerateModal = true;
	}
	
	async function suggestGoals() {
		suggestingGoals = true;
		
		try {
			const res = await fetch(`/api/drafts/suggest-goals?key=${data.apiKey}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: bookmark.title,
					excerpt: bookmark.excerpt,
					link: bookmark.link
				})
			});
			
			if (res.ok) {
				const data = await res.json();
				suggestedGoals = data.suggestions || [];
				selectedGoals = suggestedGoals.map(() => false);
			}
		} catch (e) {
			console.error('Failed to get suggestions:', e);
		}
		
		suggestingGoals = false;
	}
	
	function applySelectedGoals() {
		const selected = suggestedGoals.filter((_, i) => selectedGoals[i]);
		if (selected.length > 0) {
			repurposingGoals = repurposingGoals 
				? repurposingGoals + '\n' + selected.join('\n')
				: selected.join('\n');
		}
		suggestedGoals = [];
		selectedGoals = [];
	}
	
	async function generateDraft() {
		if (generateDraftType === 'skill' && skillDraft) {
			message = 'A skill draft already exists for this bookmark';
			return;
		}
		
		generating = true;
		message = '';
		showGenerateModal = false;
		
		try {
			const res = await fetch(`/api/generate/${bookmark.id}?key=${data.apiKey}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					draft_type: generateDraftType,
					custom_title: customTitle || undefined,
					metadata: generateDraftType === 'blog_post' ? {
						repurposing_goals: repurposingGoals || undefined,
						web_research_enabled: webResearchEnabled
					} : undefined
				})
			});
			
			if (res.ok) {
				const newDraft = await res.json();
				window.location.href = `/drafts/${newDraft.id}?key=${data.apiKey}&stream=true`;
			} else {
				const err = await res.json();
				message = err.error || 'Generation failed';
				generating = false;
			}
		} catch {
			message = 'Error generating draft';
			generating = false;
		}
	}
	
	function confirmDeleteDraft(draft: { id: number; title: string }) {
		draftToDelete = draft;
		showDeleteModal = true;
	}
	
	async function deleteDraft() {
		if (!draftToDelete) return;
		
		try {
			const res = await fetch(`/api/drafts/${draftToDelete.id}?key=${data.apiKey}`, {
				method: 'DELETE'
			});
			
			if (res.ok) {
				drafts = drafts.filter(d => d.id !== draftToDelete!.id);
				if (skillDraft?.id === draftToDelete.id) {
					skillDraft = null;
				}
				message = 'Draft deleted';
			} else {
				message = 'Failed to delete draft';
			}
		} catch {
			message = 'Error deleting draft';
		}
		
		showDeleteModal = false;
		draftToDelete = null;
	}
	
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	function formatShortDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function confirmApproval(value: boolean) {
		pendingApproval = value;
		showApprovalModal = true;
	}
	
	async function setBlogApproved(value: boolean) {
		showApprovalModal = false;
		saving = true;
		message = '';
		
		try {
			const res = await fetch(`/api/bookmarks/${bookmark.id}?key=${data.apiKey}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ blog_approved: value })
			});
			
			if (res.ok) {
				bookmark = await res.json();
				blogApproved = value;
				message = value ? 'Approved!' : 'Hidden from bookmarks';
			} else {
				message = 'Failed to update';
			}
		} catch {
			message = 'Error updating';
		}
		
		saving = false;
	}
</script>

<svelte:head>
	<title>{bookmark.title} | Bookmarks</title>
</svelte:head>

<Header />
<ThreeBackground />

{#if showApprovalModal}
	<div class="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-8 max-w-sm w-full mx-4 border border-zinc-200 shadow-xl">
			<h2 class="text-xl font-bold text-zinc-900 mb-2">
				{pendingApproval ? 'Approve Bookmark?' : 'Hide Bookmark?'}
			</h2>
			<p class="text-zinc-500 mb-6">
				{pendingApproval 
					? 'This will mark the bookmark as approved for a blog post.' 
					: 'This will hide the bookmark from the bookmarks list.'}
			</p>
			<div class="flex gap-3">
				<button 
					onclick={() => setBlogApproved(pendingApproval!)}
					class="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium text-sm transition-colors"
				>
					Confirm
				</button>
				<button 
					onclick={() => showApprovalModal = false}
					class="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteModal}
	<div class="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-8 max-w-sm w-full mx-4 border border-zinc-200 shadow-xl">
			<h2 class="text-xl font-bold text-zinc-900 mb-2">Delete Draft?</h2>
			<p class="text-zinc-500 mb-2">
				Are you sure you want to delete "{draftToDelete?.title}"?
			</p>
			<p class="text-zinc-400 text-sm mb-6">This action cannot be undone.</p>
			<div class="flex gap-3">
				<button 
					onclick={deleteDraft}
					class="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors"
				>
					Delete
				</button>
				<button 
					onclick={() => { showDeleteModal = false; draftToDelete = null; }}
					class="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showGenerateModal}
	<div class="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8">
		<div class="bg-white rounded-xl p-8 max-w-lg w-full mx-4 border border-zinc-200 shadow-xl my-auto">
			<h2 class="text-xl font-bold text-zinc-900 mb-6">Generate New Draft</h2>
			
			<div class="space-y-4 mb-6">
				<label class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors {generateDraftType === 'blog_post' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}">
					<input type="radio" bind:group={generateDraftType} value="blog_post" class="mt-1" />
					<div>
						<span class="font-medium text-zinc-900">Blog Post</span>
						<p class="text-sm text-zinc-500 mt-1">
							Creates an engaging blog post with introduction, main content, and conclusion in Markdown format.
							You can create multiple blog posts per bookmark.
						</p>
					</div>
				</label>
				
				<label class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors {generateDraftType === 'skill' ? 'border-zinc-900 bg-zinc-50' : skillDraft ? 'border-zinc-200 bg-zinc-50 opacity-50 cursor-not-allowed' : 'border-zinc-200 hover:border-zinc-300'}">
					<input type="radio" bind:group={generateDraftType} value="skill" class="mt-1" disabled={!!skillDraft} />
					<div>
						<span class="font-medium text-zinc-900">Skill (AI Agent)</span>
						<p class="text-sm text-zinc-500 mt-1">
							Researches the topic from the bookmark and generates a reusable SKILL.md file for AI agents.
							Includes: installation, API reference, examples, and embedded source references.
						</p>
						{#if skillDraft}
							<p class="text-xs text-amber-600 mt-2">Skill already exists for this bookmark</p>
						{/if}
					</div>
				</label>
			</div>
			
			{#if generateDraftType === 'blog_post'}
				<div class="space-y-4 border-t border-zinc-200 pt-6">
					<div>
						<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Custom Title (optional)</label>
						<input 
							type="text" 
							bind:value={customTitle}
							placeholder={bookmark.title}
							class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
						/>
					</div>
					
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Repurposing Goals (optional)</label>
							<button 
								type="button"
								onclick={suggestGoals}
								disabled={suggestingGoals}
								class="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors disabled:opacity-50"
							>
								{#if suggestingGoals}
									<svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								{:else}
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
									</svg>
								{/if}
								Suggest Goals
							</button>
						</div>
						<textarea 
							bind:value={repurposingGoals}
							rows={4}
							placeholder="What outcomes do you want from this blog?&#10;&#10;Examples:&#10;• Target audience: developers, beginners&#10;• SEO keywords: react hooks tutorial&#10;• Tone: educational, tutorial-style&#10;• Compare with: class components"
							class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
						></textarea>
					</div>
					
					{#if suggestedGoals.length > 0}
						<div class="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
							<p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Suggested Goals (click to select)</p>
							<div class="space-y-2">
								{#each suggestedGoals as goal, i}
									<label class="flex items-start gap-2 cursor-pointer">
										<input type="checkbox" bind:checked={selectedGoals[i]} class="mt-1" />
										<span class="text-sm text-zinc-600">{goal}</span>
									</label>
								{/each}
							</div>
							<div class="flex gap-2 mt-4">
								<button 
									type="button"
									onclick={applySelectedGoals}
									class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors"
								>
									Apply Selected
								</button>
								<button 
									type="button"
									onclick={() => { suggestedGoals = []; selectedGoals = []; }}
									class="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs transition-colors"
								>
									Clear
								</button>
							</div>
						</div>
					{/if}
					
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={webResearchEnabled} class="rounded" />
						<span class="text-sm text-zinc-600">Enable web research to expand on topics</span>
					</label>
				</div>
			{/if}
			
			<div class="flex gap-3 mt-6">
				<button 
					onclick={generateDraft}
					disabled={generating || (generateDraftType === 'skill' && !!skillDraft)}
					class="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{generating ? 'Generating...' : `Generate ${generateDraftType === 'skill' ? 'Skill' : 'Blog Post'}`}
				</button>
				<button 
					onclick={() => showGenerateModal = false}
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
				<a href="/bookmarks?key={data.apiKey}" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
					← Back to Bookmarks
				</a>
			</div>
			
			<div class="border-x border-zinc-200 p-6 lg:p-8">
				<div class="max-w-3xl mx-auto">
					<div class="bg-white border border-zinc-200 rounded-xl p-6 lg:p-8 shadow-sm">
						<div class="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between gap-4">
							<div class="flex-1 min-w-0">
								<p class="text-xs text-zinc-400 mb-1">Original URL</p>
								<p class="text-sm text-zinc-600 truncate">{bookmark.link}</p>
							</div>
							<a 
								href={bookmark.link} 
								target="_blank" 
								rel="noopener noreferrer"
								class="flex-shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
								Visit
							</a>
						</div>
						
						<div class="space-y-6">
							<div>
								<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Title</label>
								<input 
									type="text" 
									bind:value={title}
									class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
								/>
							</div>
							
							<div>
								<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Category</label>
								{#if categories.length > 10}
									<input 
										type="text"
										bind:value={category}
										list="category-list"
										placeholder="Select or type new category..."
										class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
									/>
									<datalist id="category-list">
										{#each categories as cat}
											<option value={cat.name}>{cat.name}</option>
										{/each}
									</datalist>
								{:else}
									<div class="flex gap-2">
										<select 
											bind:value={category}
											onchange={() => showNewCategoryInput = false}
											class="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
										>
											{#each categories as cat}
												<option value={cat.name}>{cat.name}</option>
											{/each}
										</select>
										<button 
											type="button"
											onclick={() => { category = ''; showNewCategoryInput = true; }}
											class="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-sm border border-zinc-200 transition-colors whitespace-nowrap"
										>
											+ New
										</button>
									</div>
									{#if showNewCategoryInput}
										<input 
											type="text"
											bind:value={category}
											placeholder="New category name..."
											class="w-full mt-2 bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
										/>
									{/if}
								{/if}
							</div>
							
							<div>
								<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Tags (comma-separated)</label>
								<input 
									type="text" 
									bind:value={tags}
									placeholder="tag1, tag2, tag3"
									class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
								/>
							</div>
							
							<div>
								<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Reason for Bookmark</label>
								<textarea 
									bind:value={reason}
									rows={3}
									placeholder="Why did you bookmark this? What's interesting about it?"
									class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
								></textarea>
							</div>
							
							<div>
								<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Approved for blog post</label>
								<div class="flex gap-2">
									<button 
										type="button"
										onclick={() => confirmApproval(true)}
										class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {blogApproved === true ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'}"
									>
										Yes
									</button>
									<button 
										type="button"
										onclick={() => confirmApproval(false)}
										class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {blogApproved === false ? 'bg-red-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'}"
									>
										No
									</button>
								</div>
								{#if blogApproved === false}
									<p class="text-xs text-zinc-400 mt-2">Hidden from bookmarks list</p>
								{/if}
							</div>
							
							{#if bookmark.excerpt}
								<div>
									<label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Excerpt</label>
									<p class="text-zinc-500 bg-zinc-50 rounded-lg px-4 py-3 border border-zinc-200">
										{bookmark.excerpt}
									</p>
								</div>
							{/if}
							
							<div class="pt-4 border-t border-zinc-200">
								<p class="text-sm text-zinc-400">
									Bookmarked on {formatDate(bookmark.created_at)}
								</p>
							</div>
						</div>
						
						<div class="flex gap-4 mt-8 pt-6 border-t border-zinc-200">
							<button 
								onclick={saveChanges}
								disabled={saving}
								class="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
							
							<button 
								onclick={openGenerateModal}
								disabled={generating}
								class="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-medium disabled:opacity-50 border border-zinc-200 transition-colors"
							>
								{generating ? 'Generating...' : '+ Generate Draft'}
							</button>
							
							{#if message}
								<span class="text-sm text-zinc-500 self-center">{message}</span>
							{/if}
						</div>
					</div>
					
					{#if drafts.length > 0}
						<div class="mt-8">
							<h2 class="text-lg font-semibold text-zinc-900 mb-4">Drafts ({drafts.length})</h2>
							<div class="space-y-3">
								{#each drafts as draft}
									<div class="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-2 mb-1">
													{#if draft.draft_type === 'skill'}
														<span class="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Skill</span>
													{:else}
														<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Blog Post</span>
													{/if}
													<span class="px-2 py-0.5 rounded-full text-xs font-medium {
														draft.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
														draft.status === 'rejected' ? 'bg-red-100 text-red-700' :
														'bg-amber-100 text-amber-700'
													}">
														{draft.status}
													</span>
												</div>
												<h3 class="font-medium text-zinc-900 truncate">{draft.title}</h3>
												<p class="text-xs text-zinc-400 mt-1">{formatShortDate(draft.created_at)}</p>
											</div>
											<div class="flex items-center gap-2">
												<a 
													href="/drafts/{draft.id}?key={data.apiKey}"
													class="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm transition-colors"
												>
													View
												</a>
												<button 
													onclick={() => confirmDeleteDraft(draft)}
													class="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
													title="Delete draft"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
</main>
