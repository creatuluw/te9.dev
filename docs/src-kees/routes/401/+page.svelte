<!--
  Dedicated 401 Unauthorized Page
  
  A standalone 401 page shown when users need to login.
-->

<script lang="ts">
  import { ErrorPage } from '$lib/components';
  import { page } from '$app/stores';
  
  // Get the redirect URL from query params
  const redirect = $derived($page.url.searchParams.get('redirect') || '/');
  const loginUrl = $derived(`/login?redirect=${encodeURIComponent(redirect)}`);
</script>

<svelte:head>
  <title>401 - Niet geautoriseerd</title>
  <meta name="description" content="U moet ingelogd zijn om deze pagina te bekijken." />
</svelte:head>

<ErrorPage
  code={401}
  title="Niet geautoriseerd"
  message="U moet ingelogd zijn om deze pagina te bekijken. Log in om verder te gaan."
  homeUrl={loginUrl}
  supportUrl="/help"
  showHomeButton={true}
  showSupportLink={false}
>
  <div class="mt-6">
    <a 
      href={loginUrl}
      class="inline-flex items-center text-sm font-semibold text-zinc-900 hover:text-zinc-700 transition-colors font-inter"
    >
      Inloggen <span aria-hidden="true" class="ml-1">&rarr;</span>
    </a>
  </div>
</ErrorPage>

