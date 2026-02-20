<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import type { PostMeta } from '$lib/types';

	interface Props {
		data: { posts: PostMeta[] };
	}

	let { data }: Props = $props();

	const posts = $derived(data.posts);

	const rowConfigs = [6, 8, 5, 7, 6, 8, 5, 7, 6, 5, 8, 7, 6, 5, 8, 7];
	const animations = ['anim-slide', 'anim-fade', 'anim-zoom', 'anim-fall', 'anim-swipe', 'anim-warp', 'anim-flip', 'anim-bounce', 'anim-scale'];

	function getRandomAnimation() {
		return animations[Math.floor(Math.random() * animations.length)];
	}

	const rows = $derived(() => {
		const result: PostMeta[][] = [];
		let postIndex = 0;
		let rowIndex = 0;

		while (postIndex < posts.length) {
			const cols = rowConfigs[rowIndex % rowConfigs.length];
			const row: PostMeta[] = [];
			for (let col = 0; col < cols && postIndex < posts.length; col++) {
				row.push(posts[postIndex++]);
			}
			result.push(row);
			rowIndex++;
		}
		return result;
	});

	let animateCards = $state(false);

	onMount(() => {
		const returning = sessionStorage.getItem('returningFromArticle');
		if (returning) {
			sessionStorage.removeItem('returningFromArticle');
			animateCards = false;
		} else {
			animateCards = true;
		}
	});
</script>

<svelte:head>
	<title>te9-archives</title>
</svelte:head>

<Header />

<main class="pt-16 flex-1 flex flex-col">
	<section class="flex-1 flex flex-col">
		<div class="max-w-[2560px] mx-auto w-full">
			{#each rows() as row, i}
				<div class="grid border-x border-zinc-200" style="grid-template-columns: repeat({row.length}, 1fr)">
					{#each row as post, j}
						<ArticleCard {post} animation={getRandomAnimation()} {animateCards} />
					{/each}
				</div>
			{/each}
		</div>
	</section>
</main>
