<script lang="ts">
    import GardenCard from "$lib/components/ui/GardenCard.svelte";
    import SectionHeader from "$lib/components/ui/SectionHeader.svelte";
    import { gardenCards } from "$lib/components/ui/data";
</script>

<svelte:head>
    <title>Garden - te9.dev</title>
    <meta
        name="description"
        content="Patrick's Digital Garden - Experiments, patterns, and resources"
    />
</svelte:head>

<section class="garden-page">
    <div class="w-full">
        <div class="garden-grid">
            {#each gardenCards as card, i}
                <GardenCard {card} index={i} />
            {/each}
        </div>
    </div>
</section>

<style>
    .garden-page {
        min-height: 100vh;
        background: #0a0a0a;
    }

    .garden-page > div {
        max-width: none;
        margin: 0;
        padding: 0;
    }

    .garden-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 0;
    }

    .garden-card {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }

    @media (max-width: 768px) {
        .garden-page {
            padding: 0;
        }

        .garden-grid {
            grid-template-columns: 1fr;
            gap: 0;
        }
    }
</style>
