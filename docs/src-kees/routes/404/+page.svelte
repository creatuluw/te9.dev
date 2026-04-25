<!--
  Dedicated 404 Page
  
  A standalone 404 page that can be linked to or used for custom 404 handling.
-->

<script lang="ts">
  import { ErrorPage } from '$lib/components';
</script>

<svelte:head>
  <title>404 - Pagina niet gevonden</title>
  <meta name="description" content="De pagina die u zoekt kon niet worden gevonden." />
</svelte:head>

<ErrorPage
  code={404}
  title="Pagina niet gevonden"
  message="Sorry, we kunnen de pagina die u zoekt niet vinden. Misschien is deze verplaatst of verwijderd."
  homeUrl="/"
  supportUrl="/help"
/>

