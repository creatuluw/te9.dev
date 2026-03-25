<script lang="ts">
    import Hero from "$lib/components/ui/Hero.svelte";
    import GardenCard from "$lib/components/ui/GardenCard.svelte";
    import QuickLink from "$lib/components/ui/QuickLink.svelte";
    import SectionHeader from "$lib/components/ui/SectionHeader.svelte";
    import { gardenCards, quickLinks } from "$lib/components/ui/data";
</script>

<svelte:head>
    <title>te9.dev - Patrick's Digital Garden</title>
</svelte:head>

<!-- Hero Section -->
<Hero />

<!-- Garden Section -->
<section id="garden" class="py-24 px-8 bg-[#0a0a0a]">
    <div class="max-w-[1200px] mx-auto">
        <SectionHeader label="// purpose" />

        <div class="garden-grid">
            {#each gardenCards as card, i}
                <GardenCard {card} index={i} />
            {/each}
        </div>
    </div>
</section>

<!-- Links Section -->
<section id="links" class="py-24 px-8 bg-[#111111]">
    <div class="links-container">
        <SectionHeader label="// shortcuts" />

        <div class="links-grid">
            {#each quickLinks as link, i}
                <QuickLink {link} index={i} />
            {/each}
        </div>
    </div>
</section>

<style>
    .garden-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .links-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .links-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .garden-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
