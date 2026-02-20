<script lang="ts">
	import type { PostMeta } from '$lib/types';

	interface Props {
		post: PostMeta;
		animation: string;
		animateCards: boolean;
	}

	let { post, animation, animateCards }: Props = $props();
	let element: HTMLAnchorElement;
	let observed = $state(false);

	const href = $derived(post._draftId ? `/articles/${post._draftId}` : `/posts/${post.slug}`);
	const typeLabel = $derived(
		post._draftType === 'skill' || post._postType === 'skill' ? 'Skill' : null
	);

	$effect(() => {
		if (!animateCards || observed) return;
		
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					observed = true;
				}
			},
			{ rootMargin: '100px', threshold: 0.1 }
		);
		if (element) observer.observe(element);
		return () => observer.disconnect();
	});

	function handleClick() {
		sessionStorage.setItem('returningFromArticle', 'true');
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const animationClass = $derived(animateCards && observed ? animation : animateCards && !observed ? 'card-hidden' : '');
</script>

<a 
	href={href}
	bind:this={element}
	class="block {animationClass}"
	onclick={handleClick}
>
	<article class="p-5 border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group flex flex-col border-b border-r h-full">
		<span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">
			{typeLabel ? `${typeLabel} · ` : ''}{formatDate(post.date)}
		</span>
		<h2 class="text-base font-semibold tracking-tight mt-2 mb-1 group-hover:text-zinc-600 transition-colors">
			{post.title}
		</h2>
		<p class="text-zinc-500 text-sm font-light leading-relaxed line-clamp-2">
			{post.description}
		</p>
	</article>
</a>
