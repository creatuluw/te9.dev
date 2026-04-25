<script lang="ts">
    import Hero from "$lib/components/ui/Hero.svelte";
    import GardenCard from "$lib/components/ui/GardenCard.svelte";
    import QuickLink from "$lib/components/ui/QuickLink.svelte";
    import SectionHeader from "$lib/components/ui/SectionHeader.svelte";
    import { quickLinks } from "$lib/components/ui/data";

    let { data } = $props();
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

<!-- Digest Section -->
<section id="digest" class="py-24 px-8 bg-[#0f0f0f]">
    <div class="max-w-[1200px] mx-auto">
        <SectionHeader label="// digest" />

        {#if data.latestDigests.length > 0}
            <div class="digest-grid">
                {#each data.latestDigests as digest, i}
                    <a href="/digest/{digest.slug}" class="digest-card">
                        <div class="digest-card-header">
                            <span class="digest-card-tag digest-card-tag-{digest.type}">
                                {digest.type === 'last10' ? 'last 10' : 'weekly'}
                            </span>
                            <span class="digest-card-count">{digest.entryCount} entries</span>
                        </div>
                        <h3 class="digest-card-title">{digest.title}</h3>
                        <span class="digest-card-date">
                            {new Date(digest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </a>
                {/each}
            </div>
        {:else}
            <p class="digest-empty">No digests yet. Check back soon.</p>
        {/if}

        <div class="digest-more">
            <a href="/digest" class="digest-more-link">view all digests &rarr;</a>
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

    .digest-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .digest-card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
        border: 1px solid #2a2a2a;
        text-decoration: none;
        color: inherit;
        position: relative;
        overflow: hidden;
        transition: all 300ms ease;
    }

    .digest-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #00ff88, #ff9500);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 300ms ease;
    }

    .digest-card:hover::before {
        transform: scaleX(1);
    }

    .digest-card:hover {
        border-color: #333;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .digest-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .digest-card-tag {
        font-family: 'Lekton', monospace;
        font-size: 0.6875rem;
        text-transform: lowercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.75rem;
        border-radius: 2px;
    }

    .digest-card-tag-last10 {
        color: #00cc6a;
        background: rgba(0, 255, 136, 0.1);
    }

    .digest-card-tag-weekly {
        color: #ff9500;
        background: rgba(255, 149, 0, 0.1);
    }

    .digest-card-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: #666;
        letter-spacing: 0.06em;
    }

    .digest-card-title {
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #e8e8e8;
        line-height: 1.2;
    }

    .digest-card:hover .digest-card-title {
        color: #ff9500;
    }

    .digest-card-date {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.6875rem;
        color: #666;
        letter-spacing: 0.04em;
    }

    .digest-empty {
        color: #666;
        font-size: 0.875rem;
        text-align: center;
        padding: 2rem 0;
    }

    .digest-more {
        margin-top: 2rem;
        text-align: center;
    }

    .digest-more-link {
        font-family: 'Lekton', monospace;
        font-size: 0.875rem;
        color: #ff9500;
        text-decoration: none;
        text-transform: lowercase;
        transition: opacity 300ms ease;
    }

    .digest-more-link:hover {
        opacity: 0.8;
    }
</style>
