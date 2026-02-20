<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="bg-white text-zinc-900 min-h-screen flex flex-col">
	{@render children()}
</div>
