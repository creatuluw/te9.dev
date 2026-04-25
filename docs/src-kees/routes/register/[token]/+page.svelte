<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { validatePasswordStrength } from '$lib/utils/password';
	import * as minioService from '$lib/services/minioService';
	import { getUserMessage } from '$lib/types/errors';
	import { toastStore } from '$lib/stores/toastStore';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { logout } from '$lib/utils/auth';
	import { User, Lock, Eye, EyeOff, Image as ImageIcon } from 'lucide-svelte';

	const token = $derived($page.params.token);

	// Form state
	let name = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let bio = $state('');
	let avatarFile = $state<File | null>(null);
	let avatarPreview = $state<string | null>(null);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// UI state
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let email = $state<string | null>(null);
	let tokenValid = $state(false);

	// Field-level validation errors
	let fieldErrors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	// Password strength
	let passwordStrength = $derived(password ? validatePasswordStrength(password) : null);

	// Validation helpers
	function markTouched(field: string) {
		touched[field] = true;
	}

	function validateField(field: string): string | null {
		switch (field) {
			case 'name':
				if (!name.trim()) return 'Naam is verplicht';
				if (name.trim().length > 255) return 'Naam mag maximaal 255 tekens bevatten';
				return null;
			
			case 'username':
				const trimmedUsername = username.trim();
				if (trimmedUsername && trimmedUsername.length < 3) {
					return 'Gebruikersnaam moet minimaal 3 tekens bevatten (of leeglaten)';
				}
				if (trimmedUsername.length > 50) return 'Gebruikersnaam mag maximaal 50 tekens bevatten';
				return null;
			
			case 'password':
				if (!password) return 'Wachtwoord is verplicht';
				if (password.length < 8) return 'Wachtwoord moet minimaal 8 tekens bevatten';
				if (passwordStrength && !passwordStrength.valid) {
					return passwordStrength.message || 'Wachtwoord voldoet niet aan de vereisten';
				}
				return null;
			
			case 'confirmPassword':
				if (!confirmPassword) return 'Bevestig uw wachtwoord';
				if (password !== confirmPassword) return 'Wachtwoorden komen niet overeen';
				return null;
			
			default:
				return null;
		}
	}

	function updateFieldError(field: string) {
		if (touched[field]) {
			const error = validateField(field);
			if (error) {
				fieldErrors[field] = error;
			} else {
				delete fieldErrors[field];
			}
		}
	}

	// Reactive validation when fields change
	$effect(() => {
		if (touched['name']) updateFieldError('name');
	});

	$effect(() => {
		if (touched['username']) updateFieldError('username');
	});

	$effect(() => {
		if (touched['password']) updateFieldError('password');
		if (touched['confirmPassword'] && confirmPassword) updateFieldError('confirmPassword');
	});

	$effect(() => {
		if (touched['confirmPassword']) updateFieldError('confirmPassword');
	});

	function getInputClasses(field: string, baseClasses: string): string {
		const hasError = touched[field] && fieldErrors[field];
		const errorClasses = hasError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900';
		return `${baseClasses} ${errorClasses}`;
	}

	onMount(async () => {
		// Ensure user is logged out before starting registration
		await logout(false); // Don't call API, just clear local data
		await validateToken();
	});

	async function validateToken() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/auth/register/validate-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token })
			});

			const result = await response.json();

			if (result.success) {
				tokenValid = true;
				email = result.data.email;
			} else {
				error = result.error || 'Ongeldige of verlopen uitnodiging';
				tokenValid = false;
			}
		} catch (err) {
			error = 'Er is een fout opgetreden bij het valideren van de uitnodiging';
			tokenValid = false;
		} finally {
			loading = false;
		}
	}

	function handleAvatarSelect(files: FileList | null) {
		if (!files || files.length === 0) {
			avatarFile = null;
			avatarPreview = null;
			return;
		}

		const file = files[0];

		// Validate image type
		if (!file.type.startsWith('image/')) {
			toastStore.add('Alleen afbeeldingen zijn toegestaan', 'error');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toastStore.add('Afbeelding mag maximaal 5MB zijn', 'error');
			return;
		}

		avatarFile = file;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			avatarPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		fieldErrors = {};

		// Mark all fields as touched
		touched = { name: true, username: true, password: true, confirmPassword: true };

		// Validate all fields
		const nameError = validateField('name');
		const usernameError = validateField('username');
		const passwordError = validateField('password');
		const confirmPasswordError = validateField('confirmPassword');

		// Set field errors
		if (nameError) fieldErrors['name'] = nameError;
		if (usernameError) fieldErrors['username'] = usernameError;
		if (passwordError) fieldErrors['password'] = passwordError;
		if (confirmPasswordError) fieldErrors['confirmPassword'] = confirmPasswordError;

		// Stop if there are validation errors
		if (Object.keys(fieldErrors).length > 0) {
			error = 'Corrigeer de fouten in het formulier';
			return;
		}

		submitting = true;
		navigationStore.startPageLoading();
		
		// Ensure user is logged out before submitting registration
		await logout(false); // Don't call API, just clear local data

		try {
			let avatarUrl: string | null = null;

			// Upload avatar if provided
			if (avatarFile) {
				const uploadResult = await minioService.uploadFile(avatarFile, 'avatars');
				if (uploadResult.success && uploadResult.value.url) {
					avatarUrl = uploadResult.value.url;
				} else {
					toastStore.add('Fout bij uploaden van avatar', 'error');
					// Continue without avatar
				}
			}

			// Submit registration
			// Only send username if it meets minimum requirements (3+ chars) or is empty
			const trimmedUsername = username.trim();
			const usernameToSend = trimmedUsername.length >= 3 ? trimmedUsername : undefined;
			
			const response = await fetch('/api/auth/register/complete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token,
					name: name.trim(),
					username: usernameToSend,
					password,
					confirmPassword,
					avatar: avatarUrl || undefined,
					bio: bio.trim() || undefined
				})
			});

			const result = await response.json();

			if (result.success) {
				// Redirect to success page
				await goto('/register/success');
			} else {
				// Parse server validation errors
				const errorMessage = result.error || 'Er is een fout opgetreden bij het aanmaken van uw account';
				console.error('Registration failed:', result);

				// Try to extract field-specific errors from the message
				if (errorMessage.includes('name') || errorMessage.includes('Naam')) {
					fieldErrors['name'] = errorMessage;
					touched['name'] = true;
				} else if (errorMessage.includes('username') || errorMessage.includes('Gebruikersnaam')) {
					fieldErrors['username'] = errorMessage;
					touched['username'] = true;
				} else if (errorMessage.includes('password') || errorMessage.includes('Wachtwoord')) {
					fieldErrors['password'] = errorMessage;
					touched['password'] = true;
				} else {
					// General error
					error = errorMessage;
				}
			}
		} catch (err) {
			error = 'Er is een fout opgetreden bij het aanmaken van uw account';
			console.error('Registration error:', err);
		} finally {
			submitting = false;
			navigationStore.stopPageLoading();
		}
	}

	function getPasswordStrengthColor(): string {
		if (!passwordStrength) return 'text-zinc-500';
		if (passwordStrength.valid) return 'text-green-600';
		return 'text-red-600';
	}

	function getPasswordStrengthText(): string {
		if (!password) return '';
		if (passwordStrength?.valid) return 'Wachtwoordsterkte: Goed';
		return passwordStrength?.message || 'Wachtwoordsterkte: Zwak';
	}
</script>

<svelte:head>
	<title>Account Aanmaken - Business Process Management</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-4">
		<div>
			<h2 class="text-center text-2xl font-extrabold text-zinc-900 font-aspekta">
				Account Aanmaken
			</h2>
			{#if email}
				<p class="mt-1 text-center text-sm text-zinc-600 font-inter">
					Voor: {email}
				</p>
			{/if}
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-8">
				<Spinner size="md" />
				<span class="ml-3 text-zinc-600 font-inter">Uitnodiging valideren...</span>
			</div>
		{:else if !tokenValid}
			<div class="bg-white rounded-lg border border-red-200 p-4">
				<div class="text-center">
					<p class="text-red-600 font-inter mb-3">{error || 'Ongeldige of verlopen uitnodiging'}</p>
					<Button onclick={() => goto('/')}>Terug naar home</Button>
				</div>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4 bg-white rounded-lg border border-zinc-200 p-4">
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<div class="space-y-3">
					<!-- Name -->
					<div>
						<label for="name" class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Naam *
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
								<User class="w-4 h-4 {touched['name'] && fieldErrors['name'] ? 'text-red-500' : 'text-zinc-400'}" />
							</div>
							<input
								id="name"
								type="text"
								bind:value={name}
								onblur={() => markTouched('name')}
								required
								disabled={submitting}
								class={getInputClasses('name', 'w-full pl-9 pr-3 py-1.5 border rounded-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter')}
								placeholder="Jan de Vries"
							/>
						</div>
						{#if touched['name'] && fieldErrors['name']}
							<p class="mt-0.5 text-xs text-red-600 font-inter">
								{fieldErrors['name']}
							</p>
						{/if}
					</div>

					<!-- Username (optional) -->
					<div>
						<label for="username" class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Gebruikersnaam (optioneel)
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
								<User class="w-4 h-4 {touched['username'] && fieldErrors['username'] ? 'text-red-500' : 'text-zinc-400'}" />
							</div>
							<input
								id="username"
								type="text"
								bind:value={username}
								onblur={() => markTouched('username')}
								disabled={submitting}
								class={getInputClasses('username', 'w-full pl-9 pr-3 py-1.5 border rounded-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter')}
								placeholder="jan.devries"
							/>
						</div>
						{#if touched['username'] && fieldErrors['username']}
							<p class="mt-0.5 text-xs text-red-600 font-inter">
								{fieldErrors['username']}
							</p>
						{/if}
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Wachtwoord *
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
								<Lock class="w-4 h-4 {touched['password'] && fieldErrors['password'] ? 'text-red-500' : 'text-zinc-400'}" />
							</div>
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								onblur={() => markTouched('password')}
								required
								disabled={submitting}
								class={getInputClasses('password', 'w-full pl-9 pr-9 py-1.5 border rounded-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter')}
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute inset-y-0 right-0 pr-2.5 flex items-center"
								disabled={submitting}
							>
								{#if showPassword}
									<EyeOff class="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
								{:else}
									<Eye class="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
								{/if}
							</button>
						</div>
						{#if touched['password'] && fieldErrors['password']}
							<p class="mt-0.5 text-xs text-red-600 font-inter">
								{fieldErrors['password']}
							</p>
						{:else if password && !fieldErrors['password']}
							<p class="mt-0.5 text-xs {getPasswordStrengthColor()} font-inter">
								{getPasswordStrengthText()}
							</p>
						{/if}
						{#if !touched['password'] || !fieldErrors['password']}
							<p class="mt-0.5 text-xs text-zinc-500 font-inter">
								Minimaal 8 tekens, minimaal één letter en één cijfer
							</p>
						{/if}
					</div>

					<!-- Confirm Password -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Bevestig Wachtwoord *
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
								<Lock class="w-4 h-4 {touched['confirmPassword'] && fieldErrors['confirmPassword'] ? 'text-red-500' : 'text-zinc-400'}" />
							</div>
							<input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								bind:value={confirmPassword}
								onblur={() => markTouched('confirmPassword')}
								required
								disabled={submitting}
								class={getInputClasses('confirmPassword', 'w-full pl-9 pr-9 py-1.5 border rounded-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter')}
								placeholder="••••••••"
							/>
							<button
								type="button"
								onclick={() => showConfirmPassword = !showConfirmPassword}
								class="absolute inset-y-0 right-0 pr-2.5 flex items-center"
								disabled={submitting}
							>
								{#if showConfirmPassword}
									<EyeOff class="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
								{:else}
									<Eye class="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
								{/if}
							</button>
						</div>
						{#if touched['confirmPassword'] && fieldErrors['confirmPassword']}
							<p class="mt-0.5 text-xs text-red-600 font-inter">
								{fieldErrors['confirmPassword']}
							</p>
						{/if}
					</div>

					<!-- Avatar -->
					<div>
						<label class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Profielfoto (optioneel)
						</label>
						{#if avatarPreview}
							<div class="mb-2">
								<img
									src={avatarPreview}
									alt="Avatar preview"
									class="w-16 h-16 rounded-full object-cover border-2 border-zinc-300"
								/>
								<button
									type="button"
									onclick={() => {
										avatarFile = null;
										avatarPreview = null;
									}}
									class="mt-1 text-xs text-red-600 hover:text-red-800 font-inter"
									disabled={submitting}
								>
									Verwijderen
								</button>
							</div>
						{/if}
						<FileUpload
							size="sm"
							accept="image/*"
							acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/gif', '.png', '.jpg', '.jpeg', '.gif']}
							maxSize={5 * 1024 * 1024}
							description="PNG, JPG of GIF tot 5MB"
							onchange={handleAvatarSelect}
							disabled={submitting}
						/>
					</div>

					<!-- Bio -->
					<div>
						<label for="bio" class="block text-sm font-medium text-zinc-700 mb-1 font-aspekta">
							Bio (optioneel)
						</label>
						<textarea
							id="bio"
							bind:value={bio}
							rows="3"
							disabled={submitting}
							placeholder="Vertel iets over jezelf..."
							class="w-full px-3 py-1.5 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed text-sm font-inter"
						></textarea>
					</div>
				</div>

				<div>
					<Button
						type="submit"
						disabled={submitting || !passwordStrength?.valid || password !== confirmPassword}
						class="w-full"
					>
						{#if submitting}
							<Spinner size="sm" class="mr-2" />
							Account aanmaken...
						{:else}
							Account aanmaken
						{/if}
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>

