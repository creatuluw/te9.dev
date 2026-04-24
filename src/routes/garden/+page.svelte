<script lang="ts">
    import GardenCard from "$lib/components/ui/GardenCard.svelte";

    let { data } = $props();
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
            {#each data.entrances as entrance, i}
                <GardenCard
                    title={entrance.title}
                    description={entrance.description}
                    tag={entrance.tag}
                    icon={entrance.icon}
                    index={i}
                />
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

    :global(.garden-card) {
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
