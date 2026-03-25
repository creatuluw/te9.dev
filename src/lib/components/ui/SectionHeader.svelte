<script lang="ts">
    interface Props {
        label: string;
        title?: string;
    }

    let { label, title }: Props = $props();
</script>

<div class="section-header">
    <span class="section-label">{label}</span>
    {#if title}
        <h2 class="section-title">{@html title}</h2>
    {/if}
</div>

<style>
    .section-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .section-label {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.875rem;
        color: #ff9500;
        margin-bottom: 1rem;
        text-transform: lowercase;
        letter-spacing: 0.05em;
    }

    .section-title {
        font-family: "Bricolage Grotesque", sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: #e8e8e8;
        line-height: 1.2;
        margin: 0;
    }

    @media (max-width: 768px) {
        .section-title {
            font-size: 2rem;
        }
    }

    @media (max-width: 480px) {
        .section-title {
            font-size: 1.75rem;
        }
    }
</style>
