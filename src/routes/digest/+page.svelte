<script lang="ts">
    import { ArrowRight } from "@lucide/svelte";

    let { data } = $props();

    function formatDate(date: Date | string): string {
        const d = new Date(date);
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
</script>

<svelte:head>
    <title>Digest — te9.dev</title>
    <meta name="description" content="Bookmark digest archive — curated snapshots of analyzed resources" />
</svelte:head>

<section class="digest-page">
    <div class="digest-container">
        <header class="digest-masthead">
            <span class="digest-label">[ digest / archive ]</span>
            <h1 class="digest-title">Digest<span class="dot">.</span> archive</h1>
            <p class="digest-desc">
                Browse all generated bookmark digests. Each digest is a curated snapshot of analyzed resources — crawled, parsed, and annotated by an LLM.
            </p>
        </header>

        <hr class="digest-divider" />

        {#if data.digests.length === 0}
            <div class="digest-empty">
                <p>No digests generated yet. Run <code>npm run digest:weekly</code> or <code>npm run digest:last10</code> to generate one.</p>
            </div>
        {:else}
            <div class="digest-list">
                {#each data.digests as digest, i}
                    <a href="/digest/{digest.slug}" class="digest-item">
                        <div class="digest-item-header">
                            <span class="tag tag-{digest.type === 'weekly' ? 'accent' : 'default'}">{digest.type === 'last10' ? 'last 10' : 'weekly'}</span>
                            {#if digest.emailSent}
                                <span class="digest-sent">sent</span>
                            {/if}
                        </div>
                        <h2 class="digest-item-title">{digest.title}</h2>
                        <div class="digest-item-meta">
                            <span class="digest-item-date">{formatDate(digest.createdAt)}</span>
                            <span class="digest-item-sep">\u00b7</span>
                            <span class="digest-item-count">{digest.entryCount} entries</span>
                        </div>
                        <span class="digest-item-arrow">
                            <ArrowRight size={16} />
                        </span>
                    </a>
                    {#if i < data.digests.length - 1}
                        <hr class="digest-divider-dashed" />
                    {/if}
                {/each}
            </div>
        {/if}

        <hr class="digest-divider" />

        <footer class="digest-footer">
            <span class="digest-footer-brand">\u203a te9.dev</span>
            <span class="digest-footer-meta">{data.digests.length} digests</span>
        </footer>
    </div>
</section>

<style>
    .digest-page {
        min-height: 100vh;
        background: #0a0a0a;
    }

    .digest-container {
        max-width: 820px;
        margin: 0 auto;
        padding: 4rem clamp(1rem, 3vw, 2rem);
    }

    .digest-masthead {
        margin-bottom: 3rem;
    }

    .digest-label {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        letter-spacing: 0.1em;
        text-transform: lowercase;
        color: #ff9500;
        margin-bottom: 1rem;
    }

    .digest-title {
        font-family: "Bricolage Grotesque", sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.05;
        color: #e8e8e8;
        margin-bottom: 1rem;
    }

    .digest-title .dot {
        color: #ff9500;
    }

    .digest-desc {
        font-size: 1rem;
        color: #888888;
        line-height: 1.7;
        max-width: 60ch;
    }

    .digest-divider {
        border: none;
        height: 1px;
        background: #2a2a2a;
        margin: 2rem 0;
    }

    .digest-divider-dashed {
        border: none;
        height: 0;
        border-top: 1px dashed #2a2a2a;
        margin: 0;
    }

    .digest-empty {
        padding: 3rem 0;
        text-align: center;
        color: #666666;
        font-size: 0.875rem;
    }

    .digest-empty code {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8125rem;
        color: #ff9500;
        background: rgba(255, 149, 0, 0.1);
        padding: 0.125rem 0.5rem;
        border-radius: 2px;
    }

    .digest-list {
        display: flex;
        flex-direction: column;
    }

    .digest-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.5rem 0;
        text-decoration: none;
        color: inherit;
        position: relative;
        transition: all 300ms ease;
    }

    .digest-item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.6875rem;
        font-family: "Lekton", monospace;
        text-transform: lowercase;
        letter-spacing: 0.05em;
        border-radius: 2px;
    }

    .tag-default {
        color: #00cc6a;
        background: rgba(0, 255, 136, 0.1);
    }

    .tag-accent {
        color: #ff9500;
        background: rgba(255, 149, 0, 0.1);
    }

    .digest-sent {
        font-family: "JetBrains Mono", monospace;
        font-size: 9px;
        letter-spacing: 0.08em;
        color: #666666;
        text-transform: lowercase;
    }

    .digest-item-title {
        font-family: "Bricolage Grotesque", sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #e8e8e8;
        line-height: 1.2;
        transition: color 300ms ease;
    }

    .digest-item:hover .digest-item-title {
        color: #ff9500;
    }

    .digest-item-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: #666666;
        letter-spacing: 0.04em;
    }

    .digest-item-sep {
        color: #2a2a2a;
    }

    .digest-item-arrow {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        color: #ff9500;
        opacity: 0;
        transition: all 300ms ease;
    }

    .digest-item:hover .digest-item-arrow {
        opacity: 1;
        transform: translateY(-50%) translateX(4px);
    }

    .digest-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 2rem;
    }

    .digest-footer-brand {
        font-family: "JetBrains Mono", monospace;
        font-size: 1rem;
        font-weight: 700;
        color: #ff9500;
    }

    .digest-footer-meta {
        font-family: "JetBrains Mono", monospace;
        font-size: 9px;
        letter-spacing: 0.08em;
        color: #666666;
    }

    @media (max-width: 768px) {
        .digest-title {
            font-size: 2rem;
        }
        .digest-container {
            padding: 2rem 1rem;
        }
    }
</style>
