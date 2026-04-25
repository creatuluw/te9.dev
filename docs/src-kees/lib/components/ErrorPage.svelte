<!--
  ErrorPage Component
  
  A reusable component for displaying error pages with consistent styling.
  Uses zinc color palette and font-aspekta for headings.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from './Button.svelte';

  interface Props {
    /** Error code (e.g., 404, 403, 500) */
    code: number | string;
    
    /** Error title/heading */
    title: string;
    
    /** Error description/message */
    message: string;
    
    /** Show "Go back home" button */
    showHomeButton?: boolean;
    
    /** Show "Contact support" link */
    showSupportLink?: boolean;
    
    /** Custom home URL (defaults to /) */
    homeUrl?: string;
    
    /** Custom support URL */
    supportUrl?: string;
    
    /** Additional CSS classes */
    class?: string;
    
    /** Children content */
    children?: import('svelte').Snippet;
  }

  let {
    code,
    title,
    message,
    showHomeButton = true,
    showSupportLink = true,
    homeUrl = '/',
    supportUrl = '/help',
    class: className = '',
    children
  }: Props = $props();

  function handleGoHome() {
    goto(homeUrl);
  }

  function handleContactSupport() {
    goto(supportUrl);
  }
</script>

<main class="grid min-h-full place-items-center bg-zinc-50 px-6 py-24 sm:py-32 lg:px-8 {className}">
  <div class="text-center">
    <!-- Error Code -->
    <p class="text-base font-semibold text-zinc-900 font-aspekta tracking-tight antialiased">
      {code}
    </p>
    
    <!-- Title -->
    <h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-7xl font-aspekta antialiased">
      {title}
    </h1>
    
    <!-- Message -->
    <p class="mt-6 text-lg font-medium text-pretty text-zinc-600 sm:text-xl/8 font-inter">
      {message}
    </p>
    
    <!-- Actions -->
    {#if showHomeButton || showSupportLink}
      <div class="mt-10 flex items-center justify-center gap-x-6">
        {#if showHomeButton}
          <Button onclick={handleGoHome}>
            Terug naar home
          </Button>
        {/if}
        
        {#if showSupportLink}
          <button 
            onclick={handleContactSupport}
            class="text-sm font-semibold text-zinc-900 hover:text-zinc-700 transition-colors font-inter"
          >
            Contact opnemen <span aria-hidden="true">&rarr;</span>
          </button>
        {/if}
      </div>
    {/if}

    <!-- Additional content -->
    {#if children}
      {@render children()}
    {/if}
  </div>
</main>

