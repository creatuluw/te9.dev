<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let token = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');
  let tokenValid = $state(false);
  let checkingToken = $state(true);
  
  onMount(() => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('token') || '';
      
      if (!token) {
        errorMessage = 'Ongeldige reset link. Vraag een nieuwe aan.';
        checkingToken = false;
      } else {
        // Validate token by attempting to verify it
        validateToken();
      }
    }
  });
  
  async function validateToken() {
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/password/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      const result = await response.json();
      
      if (result.success) {
        tokenValid = true;
      } else {
        errorMessage = 'Deze reset link is verlopen of ongeldig. Vraag een nieuwe aan.';
        tokenValid = false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      errorMessage = 'Er is een probleem opgetreden. Probeer het later opnieuw.';
      tokenValid = false;
    } finally {
      checkingToken = false;
    }
  }
  
  async function handleResetPassword() {
    if (!browser) return;
    
    errorMessage = '';
    successMessage = '';
    
    // Validation
    if (!password || password.length < 8) {
      errorMessage = 'Wachtwoord moet minimaal 8 karakters bevatten';
      return;
    }
    
    if (password !== confirmPassword) {
      errorMessage = 'Wachtwoorden komen niet overeen';
      return;
    }
    
    isLoading = true;
    
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      
      const result = await response.json();
      
      if (result.success) {
        successMessage = 'Uw wachtwoord is succesvol gewijzigd. U wordt doorgestuurd naar de inlogpagina...';
        setTimeout(() => {
          goto('/login');
        }, 2000);
      } else {
        errorMessage = result.error || 'Er is een fout opgetreden. Probeer het opnieuw.';
      }
    } catch (error) {
      console.error('Reset password error:', error);
      errorMessage = 'Er is een probleem opgetreden. Probeer het later opnieuw.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg shadow-sm border border-zinc-200 p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-aspekta font-semibold text-zinc-900 tracking-tight">
          Wachtwoord opnieuw instellen
        </h1>
        <p class="mt-2 text-sm text-zinc-600 font-inter">
          Voer uw nieuwe wachtwoord in.
        </p>
      </div>
      
      {#if checkingToken}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          <span class="ml-3 text-zinc-600 font-inter">Valideren...</span>
        </div>
      {:else if !tokenValid}
        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800 font-inter">{errorMessage}</p>
        </div>
        <div class="mt-6 text-center">
          <a href="/forgot-password" class="text-sm text-zinc-600 hover:text-zinc-900 font-inter">
            Nieuwe reset link aanvragen
          </a>
        </div>
      {:else}
        {#if successMessage}
          <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-green-800 font-inter">{successMessage}</p>
          </div>
        {/if}
        
        {#if errorMessage}
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800 font-inter">{errorMessage}</p>
          </div>
        {/if}
        
        <form onsubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-zinc-700 font-inter mb-1">
              Nieuw wachtwoord
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              disabled={isLoading}
              class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed font-inter"
              placeholder="Minimaal 8 karakters"
              required
              minlength="8"
            />
          </div>
          
          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-zinc-700 font-inter mb-1">
              Bevestig wachtwoord
            </label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              disabled={isLoading}
              class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed font-inter"
              placeholder="Herhaal wachtwoord"
              required
              minlength="8"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            class="w-full bg-zinc-900 text-white py-2 px-4 rounded-sm hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed font-aspekta tracking-tight"
          >
            {isLoading ? 'Bezig met opslaan...' : 'Wachtwoord opslaan'}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <a href="/login" class="text-sm text-zinc-600 hover:text-zinc-900 font-inter">
            Terug naar inloggen
          </a>
        </div>
      {/if}
    </div>
  </div>
</div>

