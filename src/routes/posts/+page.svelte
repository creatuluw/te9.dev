<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import type { PostMeta } from '$lib/types';

	interface Props {
		data: { posts: PostMeta[] };
	}

	let { data }: Props = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Articles - te9-archives</title>
</svelte:head>

<Header />

<main class="pt-16 flex-1">
	<div class="max-w-4xl mx-auto px-6 py-12">
		<h1 class="text-3xl font-semibold tracking-tight mb-8">Articles</h1>
		<div class="space-y-6">
			{#each data.posts as post}
				<a href="/posts/{post.slug}" class="block p-6 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors group">
					<span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">
						{formatDate(post.date)}
					</span>
					<h2 class="text-lg font-semibold tracking-tight mt-2 mb-2 group-hover:text-zinc-600 transition-colors">
						{post.title}
					</h2>
					<p class="text-zinc-500 text-sm leading-relaxed">
						{post.description}
					</p>
				</a>
			{/each}
		</div>
	</div>
</main>
