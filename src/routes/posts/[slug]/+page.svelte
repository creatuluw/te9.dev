<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import type { PostMeta } from '$lib/types';

	interface Props {
		data: { meta: PostMeta; content: string };
	}

	let { data }: Props = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const typeLabel = $derived(data.meta._postType === 'skill' ? 'Skill' : null);
</script>

<svelte:head>
	<title>{data.meta.title} - te9-archives</title>
	<meta name="description" content={data.meta.description} />
</svelte:head>

<Header />

<main class="pt-16 flex-1">
	<article class="max-w-4xl mx-auto px-6 py-12">
		<a href="/" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 inline-block">
			← Back to articles
		</a>
		<header class="mb-8">
			<span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">
				{typeLabel ? `${typeLabel} · ` : ''}{formatDate(data.meta.date)}
			</span>
			<h1 class="text-4xl font-semibold tracking-tight mt-2">{data.meta.title}</h1>
		</header>
		<div class="prose">
			{@html data.content}
		</div>
	</article>
</main>
