<script lang="ts">
	import { Mail } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Account Aangemaakt - Business Process Management</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-lg border border-zinc-200 p-8 text-center">
			<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
				<Mail class="h-6 w-6 text-green-600" />
			</div>
			
			<h2 class="text-2xl font-bold text-zinc-900 mb-4 font-aspekta">
				Account Succesvol Aangemaakt!
			</h2>
			
			<p class="text-zinc-600 mb-6 font-inter">
				U heeft een e-mail ontvangen om uw e-mailadres te verifiëren. <strong>Klik op de link in de e-mail</strong> om uw account te activeren.
			</p>
			
			<p class="text-sm text-zinc-500 mb-6 font-inter">
				Na verificatie kunt u inloggen met uw e-mailadres en wachtwoord.
			</p>
		</div>
	</div>
</div>



