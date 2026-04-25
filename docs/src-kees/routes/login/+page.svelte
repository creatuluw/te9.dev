<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';
  import { Spinner } from '$lib/components';
  
  let username = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');
  
  function isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  }
  
  // Redirect if already authenticated with valid token (using afterNavigate to avoid hydration issues)
  if (browser) {
    afterNavigate(() => {
      const authDataStr = localStorage.getItem('auth_data');
      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          if (!isTokenExpired(authData.expiresAt)) {
            goto('/');
          } else {
            // Token expired, clear auth data
            authStore.clearAuth();
            localStorage.removeItem('auth');
          }
        } catch (e) {
          // Invalid auth data, clear it
          authStore.clearAuth();
          localStorage.removeItem('auth');
        }
      }
    });
  }
  
  async function loginWithCredentials(event?: Event) {
    if (!browser) return;
    
    // Prevent default form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    isLoading = true;
    errorMessage = '';
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Call new auth API with timeout
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username,
          password: password
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.error || `Server error: ${response.status}`;
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Store auth data
        authStore.setAuth(result.data);
        localStorage.setItem('auth', 'true');
        
        console.log('Login successful, checking user roles...');
        
        // Check if user has only guest role
        const roles = result.data.roles || [];
        const hasOnlyGuestRole = roles.length === 1 && roles[0].name.toLowerCase() === 'gasten';
        
        if (hasOnlyGuestRole) {
          // Redirect to guest page with welcome message
          console.log('User has only guest role, redirecting to /gast');
          goto('/gast');
        } else {
          // Regular redirect to home
          console.log('Redirecting to home...');
          goto('/');
        }
      } else {
        errorMessage = result.error || 'E-mail of wachtwoord onjuist!';
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Login error:', error);
      
      // Check if it's a timeout/abort error
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        errorMessage = 'Het inloggen duurt te lang. Controleer uw internetverbinding en probeer het opnieuw.';
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Kan geen verbinding maken met de server. Controleer uw internetverbinding.';
      } else {
        errorMessage = 'Er is een probleem opgetreden tijdens het inloggen. Probeer het later opnieuw.';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-zinc-50">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg shadow-lg p-8">
      <h3 class="text-2xl font-semibold text-center mb-2">Welkom bij Kees!</h3>
      <p class="text-center text-zinc-600 mb-6">Log hier in.</p>
      <form onsubmit={(e) => { e.preventDefault(); loginWithCredentials(e); }} action="javascript:void(0)">
        <div class="mb-4">
          <input 
            class="form-input w-full" 
            bind:value={username}
            type="text" 
            name="email" 
            placeholder="naam@hoipippeloi.nl" 
            autocomplete="email"
            required
            disabled={isLoading}
          />
        </div>
        <div class="mb-6">
          <input 
            class="form-input w-full" 
            bind:value={password}
            type="password" 
            name="password" 
            placeholder="••••••••••••••••" 
            autocomplete="current-password"
            required
            disabled={isLoading}
          />
        </div>
        <div class="mb-4">
          <button 
            type="submit"
            class="w-full bg-zinc-900 text-white py-2 px-4 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="flex items-center justify-center gap-2">
                <Spinner size="sm" variant="default" class="text-white" />
                <span>Inloggen...</span>
              </div>
            {:else}
              Login
            {/if}
          </button>
        </div>
      </form>
      {#if errorMessage}
        <p class="text-red-600 text-center text-sm mt-4">{errorMessage}</p>
      {/if}
      
      <div class="mt-6 text-center space-y-2">
        <div>
          <a href="/forgot-password" class="text-sm text-zinc-600 hover:text-zinc-900 font-inter">
            Wachtwoord vergeten?
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

