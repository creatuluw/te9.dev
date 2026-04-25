<!--
  SvelteKit Error Page
  
  This is the catch-all error page that SvelteKit renders when an error occurs.
  It handles all error codes (404, 403, 500, etc.) using the ErrorPage component.
-->

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ErrorPage } from '$lib/components';
  import { onMount } from 'svelte';

  // Derive error information from page store
  const errorCode = $derived($page.status);
  const errorMessage = $derived($page.error?.message || '');
  
  // For 403 errors, redirect to dedicated 403 page with route info
  onMount(() => {
    if (errorCode === 403) {
      // Extract route and action from error message if available
      const errorData = $page.error as any;
      const route = errorData?.route || '';
      const action = errorData?.action || '';
      
      // Build query params
      const params = new URLSearchParams();
      if (route) params.set('route', route);
      if (action) params.set('action', action);
      
      const queryString = params.toString();
      goto(`/403${queryString ? '?' + queryString : ''}`, { replaceState: true });
    }
  });

  // Map error codes to Dutch titles and messages
  const errorConfig = $derived.by(() => {
    switch (errorCode) {
      case 404:
        return {
          title: 'Pagina niet gevonden',
          message: 'Sorry, we kunnen de pagina die u zoekt niet vinden. Controleer de URL of ga terug naar de homepagina.'
        };
      
      case 403:
        return {
          title: 'Geen toegang',
          message: 'U heeft geen toegang tot deze pagina. Neem contact op met de systeembeheerder als u denkt dat dit een vergissing is.'
        };
      
      case 401:
        return {
          title: 'Niet geautoriseerd',
          message: 'U moet ingelogd zijn om deze pagina te bekijken. Log in en probeer het opnieuw.'
        };
      
      case 500:
        return {
          title: 'Er ging iets mis',
          message: 'Er is een onverwachte fout opgetreden op de server. Probeer het later opnieuw of neem contact op met support.'
        };
      
      case 503:
        return {
          title: 'Service niet beschikbaar',
          message: 'De service is tijdelijk niet beschikbaar. We werken aan het probleem. Probeer het over een paar minuten opnieuw.'
        };
      
      default:
        return {
          title: 'Er is een fout opgetreden',
          message: errorMessage || 'Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op met support.'
        };
    }
  });
</script>

<svelte:head>
  <title>{errorCode} - {errorConfig.title}</title>
</svelte:head>

<ErrorPage
  code={errorCode}
  title={errorConfig.title}
  message={errorConfig.message}
  homeUrl="/"
  supportUrl="/help"
>
  {#if import.meta.env.DEV && errorMessage}
    <div class="mt-8 text-left max-w-2xl mx-auto">
      <details class="bg-zinc-100 border border-zinc-200 rounded-lg p-4">
        <summary class="font-semibold text-zinc-900 cursor-pointer font-aspekta">
          Technische details (alleen zichtbaar in ontwikkelingsmodus)
        </summary>
        <pre class="mt-4 text-sm text-zinc-700 font-pt-mono overflow-x-auto">{errorMessage}</pre>
      </details>
    </div>
  {/if}
</ErrorPage>
