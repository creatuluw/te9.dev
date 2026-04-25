<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { toastStore } from '$lib/stores/toastStore';
	import { User, LogOut } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';

	let userName = $state('');

	onMount(() => {
		const auth = authStore.getAuth();
		
		// Check if user is authenticated
		if (!auth) {
			goto('/login');
			return;
		}

		// Get user name
		userName = auth.user?.name || auth.user?.email || 'Gast';

		// Check if user has guest role
		const hasGuestRole = auth.roles?.some(role => role.name.toLowerCase() === 'gasten');
		
		// If user doesn't have guest role, redirect to home
		if (!hasGuestRole) {
			goto('/');
			return;
		}

		// Show welcome message
		toastStore.add(`Welkom ${userName}! Je bent succesvol ingelogd als gast.`, 'success');
	});

	async function handleLogout() {
		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include'
			});

			authStore.clearAuth();
			localStorage.removeItem('auth');
			
			toastStore.add('Je bent uitgelogd', 'info');
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
			toastStore.add('Er is een fout opgetreden bij het uitloggen', 'error');
		}
	}
</script>

<div class="min-h-screen bg-zinc-50">
	<div class="max-w-4xl mx-auto px-4 py-12">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm p-8 mb-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
						<User class="w-8 h-8 text-zinc-600" />
					</div>
					<div>
						<h1 class="text-3xl font-aspekta font-semibold text-zinc-900 tracking-tight">
							Welkom, {userName}!
						</h1>
						<p class="text-zinc-600 font-inter mt-1">Gastgebruiker</p>
					</div>
				</div>
				<Button variant="outline" size="sm" onclick={handleLogout}>
					<LogOut class="w-4 h-4 mr-2" />
					Uitloggen
				</Button>
			</div>
		</div>

		<!-- Welcome Message -->
		<div class="bg-white rounded-lg shadow-sm p-8 mb-6">
			<h2 class="text-xl font-aspekta font-semibold text-zinc-900 mb-4">
				Over je gastaccount
			</h2>
			<div class="prose prose-zinc max-w-none font-inter">
				<p class="text-zinc-700 leading-relaxed mb-4">
					Je bent ingelogd met een gastaccount. Met dit account heb je beperkte toegang tot het systeem.
				</p>
				<p class="text-zinc-700 leading-relaxed mb-4">
					Als je meer functionaliteit nodig hebt, neem dan contact op met de beheerder om je toegangsrechten uit te breiden.
				</p>
			</div>
		</div>

		<!-- Available Features (placeholder for future expansion) -->
		<div class="bg-white rounded-lg shadow-sm p-8">
			<h2 class="text-xl font-aspekta font-semibold text-zinc-900 mb-4">
				Beschikbare functies
			</h2>
			<div class="text-zinc-600 font-inter">
				<p>Er zijn momenteel geen speciale functies beschikbaar voor gastgebruikers.</p>
				<p class="mt-2 text-sm text-zinc-500">
					Neem contact op met de beheerder voor meer informatie.
				</p>
			</div>
		</div>
	</div>
</div>

