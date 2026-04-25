<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { CheckCircle, XCircle } from 'lucide-svelte';

	const token = $derived($page.params.token);

	let loading = $state(true);
	let success = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		await verifyEmail();
	});

	async function verifyEmail() {
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/auth/verify-email/${token}`);

			const result = await response.json();

			if (result.success) {
				success = true;
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/login');
				}, 3000);
			} else {
				error = result.error || 'Verificatie mislukt';
			}
		} catch (err) {
			error = 'Er is een fout opgetreden bij het verifiëren van uw e-mailadres';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>E-mailadres Verifiëren - Business Process Management</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-lg border border-zinc-200 p-8 text-center">
			{#if loading}
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-zinc-100 mb-4">
					<Spinner size="md" />
				</div>
				<h2 class="text-2xl font-bold text-zinc-900 mb-4 font-aspekta">
					E-mailadres Verifiëren...
				</h2>
				<p class="text-zinc-600 font-inter">
					Even geduld, uw e-mailadres wordt geverifieerd.
				</p>
			{:else if success}
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
					<CheckCircle class="h-6 w-6 text-green-600" />
				</div>
				<h2 class="text-2xl font-bold text-zinc-900 mb-4 font-aspekta">
					E-mailadres Geverifieerd!
				</h2>
				<p class="text-zinc-600 mb-6 font-inter">
					Uw account is nu geactiveerd. U wordt automatisch doorgestuurd naar de inlogpagina.
				</p>
				<Button onclick={() => goto('/login')} class="w-full">
					Naar inlogpagina
				</Button>
			{:else}
				<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
					<XCircle class="h-6 w-6 text-red-600" />
				</div>
				<h2 class="text-2xl font-bold text-zinc-900 mb-4 font-aspekta">
					Verificatie Mislukt
				</h2>
				<p class="text-zinc-600 mb-6 font-inter">
					{error || 'De verificatielink is ongeldig of verlopen.'}
				</p>
				<Button onclick={() => goto('/login')} class="w-full">
					Naar inlogpagina
				</Button>
			{/if}
		</div>
	</div>
</div>

