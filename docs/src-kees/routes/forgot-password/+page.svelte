<script lang="ts">
  import { browser } from '$app/environment';
  
  let email = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');
  
  async function handleForgotPassword() {
    if (!browser) return;
    
    if (!email || !email.includes('@')) {
      errorMessage = 'Voer een geldig e-mailadres in';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (result.success) {
        successMessage = 'Er is een e-mail verzonden met instructies om uw wachtwoord opnieuw in te stellen.';
        email = '';
      } else {
        errorMessage = result.error || 'Er is een fout opgetreden. Probeer het opnieuw.';
      }
    } catch (error) {
      console.error('Forgot password error:', error);
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
          Wachtwoord vergeten
        </h1>
        <p class="mt-2 text-sm text-zinc-600 font-inter">
          Voer uw e-mailadres in en we sturen u instructies om uw wachtwoord opnieuw in te stellen.
        </p>
      </div>
      
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
      
      <form onsubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-zinc-700 font-inter mb-1">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            disabled={isLoading}
            class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed font-inter"
            placeholder="naam@hoipippeloi.nl"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          class="w-full bg-zinc-900 text-white py-2 px-4 rounded-sm hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed font-aspekta tracking-tight"
        >
          {isLoading ? 'Bezig met verzenden...' : 'Verstuur reset link'}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <a href="/login" class="text-sm text-zinc-600 hover:text-zinc-900 font-inter">
          Terug naar inloggen
        </a>
      </div>
    </div>
  </div>
</div>

