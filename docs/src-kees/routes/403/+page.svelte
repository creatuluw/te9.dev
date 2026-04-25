<!--
  Dedicated 403 Forbidden Page
  
  A standalone 403 page shown when users try to access pages they don't have permission for.
-->

<script lang="ts">
  import { ErrorPage } from '$lib/components';
  import { page } from '$app/stores';
  
  // Extract route and action from URL params if provided
  const requiredRoute = $derived($page.url.searchParams.get('route') || '');
  const requiredAction = $derived($page.url.searchParams.get('action') || '');
</script>

<svelte:head>
  <title>403 - Geen toegang</title>
  <meta name="description" content="U heeft geen toegang tot deze pagina." />
</svelte:head>

<ErrorPage
  code={403}
  title="Geen toegang"
  message="U heeft geen toegang tot deze pagina. Neem contact op met de systeembeheerder om toegang aan te vragen."
  homeUrl="/"
  supportUrl="/help"
>
  {#if requiredRoute}
    <div class="mt-8 bg-zinc-100 border border-zinc-200 rounded-lg p-6 max-w-md mx-auto">
      <h3 class="font-semibold text-zinc-900 font-aspekta mb-3">Benodigde rechten:</h3>
      <div class="space-y-2 text-sm text-zinc-700 font-inter">
        <div class="flex justify-between">
          <span class="text-zinc-500">Route:</span>
          <code class="font-pt-mono bg-white px-2 py-1 rounded border border-zinc-300">{requiredRoute}</code>
        </div>
        {#if requiredAction}
          <div class="flex justify-between">
            <span class="text-zinc-500">Actie:</span>
            <code class="font-pt-mono bg-white px-2 py-1 rounded border border-zinc-300">{requiredAction}</code>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</ErrorPage>

