<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';
  import { logoutAndRedirect } from '$lib/utils/auth';
  import { startComponentLoading, stopComponentLoading } from '$lib/stores/navigationStore.svelte';

  let isAuthenticated = false;
  let isLoading = true;
  let hasNoPermissions = false;
  let userEmail = '';

  function isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  }

  onMount(async () => {
    if (!browser) {
      isLoading = false;
      return;
    }

    startComponentLoading('Auth');
    // Commented out: verbose auth component logs
    // console.log('Auth component mounted');
    try {
      // Initialize authStore early from localStorage before checking auth state
      // This ensures API calls made by child components have access to the token
      authStore.init();
      
      // Check for token expiration (new auth system)
      const authDataStr = localStorage.getItem('auth_data');
      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        
        // Check if using new auth system (has expiresAt) or old (has timestamp)
        const isExpired = authData.expiresAt 
          ? isTokenExpired(authData.expiresAt)
          : false; // Old PocketBase sessions don't expire the same way
        
        if (isExpired) {
          console.log('Token expired, logging out...');
          logoutAndRedirect();
          isAuthenticated = false;
        } else {
          isAuthenticated = Boolean(localStorage.getItem('auth'));
          
          // Store user email for display
          if (authData.user?.email) {
            userEmail = authData.user.email;
          }
          
          // Check if user has any permissions
          if (isAuthenticated && authData.user) {
            try {
              const permissionsResponse = await fetch('/api/auth/me', {
                headers: {
                  'Authorization': `Bearer ${authData.token}`
                }
              });
              
              if (permissionsResponse.ok) {
                const result = await permissionsResponse.json();
                
                // API returns { success: true, data: { user, roles, permissions, ... } }
                const userData = result.success ? result.data : result;
                
                // Check if user is sysadmin - sysadmins always have access
                if (userData.user?.is_sysadmin) {
                  // Commented out: verbose auth component logs
                  // console.log('User is sysadmin, granting access');
                  // Sysadmins have all permissions, don't block
                } else if (!userData.permissions || userData.permissions.length === 0) {
                  // Non-sysadmin with no permissions
                  hasNoPermissions = true;
                  isLoading = false;
                  return; // Don't redirect, show the no permissions message
                }
              }
            } catch (e) {
              console.error('Error checking permissions:', e);
            }
          }
          
          // Sync cookie if user is authenticated but cookie might be missing
          // This ensures server-side hooks can authenticate page requests
          if (isAuthenticated && authData.token) {
            // Set cookie via API call to ensure it's set with proper httpOnly flags
            // We'll do this silently in the background
            fetch('/api/auth/sync-cookie', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authData.token}`,
                'Content-Type': 'application/json'
              }
            }).catch(console.error); // Fire and forget - don't block initialization
          }
        }
      } else {
        isAuthenticated = false;
      }
      
      // Commented out: verbose auth component logs
      // console.log('Auth state:', { isAuthenticated, hasNoPermissions });
      
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to /login');
        goto('/login');
      }
    } catch (error) {
      console.error('Error during Auth initialization:', error);
    } finally {
      isLoading = false;
      stopComponentLoading('Auth');
    }
  });
</script>

{#if isLoading}
  <div class="min-h-screen"></div>
{:else if hasNoPermissions}
  <div class="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-sm border border-zinc-200 p-8">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-aspekta font-semibold text-zinc-900 mb-2">
          Account in afwachting
        </h1>
        <p class="text-zinc-600 mb-6">
          Uw account is succesvol aangemaakt, maar er zijn nog geen rechten toegewezen.
        </p>
      </div>

      <div class="bg-zinc-50 rounded-lg p-4 mb-6 border border-zinc-200">
        <p class="text-sm text-zinc-700 mb-2">
          <span class="font-medium">Account:</span> {userEmail || 'Ingelogd'}
        </p>
        <p class="text-sm text-zinc-600">
          Neem contact op met de systeembeheerder om toegang aan te vragen voor de applicatie.
        </p>
      </div>

      <div class="space-y-3">
        <button
          onclick={logoutAndRedirect}
          class="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-lg font-aspekta font-medium hover:bg-zinc-800 transition-colors"
        >
          Uitloggen
        </button>
        <a
          href="/help"
          class="block w-full px-4 py-2.5 bg-white text-zinc-900 rounded-lg font-aspekta font-medium border border-zinc-300 hover:bg-zinc-50 transition-colors text-center"
        >
          Hulp nodig?
        </a>
      </div>

      <p class="text-xs text-zinc-500 text-center mt-6">
        Zodra de beheerder rechten heeft toegewezen, kunt u opnieuw inloggen om toegang te krijgen.
      </p>
    </div>
  </div>
{:else}
  <slot />
{/if}

