<!--
  Dedicated 500 Server Error Page
  
  A standalone 500 page for server errors.
-->

<script lang="ts">
  import { ErrorPage } from '$lib/components';
</script>

<svelte:head>
  <title>500 - Server fout</title>
  <meta name="description" content="Er is een serverfout opgetreden." />
</svelte:head>

<ErrorPage
  code={500}
  title="Er ging iets mis"
  message="Er is een onverwachte fout opgetreden op de server. Ons team is op de hoogte gesteld. Probeer het later opnieuw."
  homeUrl="/"
  supportUrl="/help"
/>

