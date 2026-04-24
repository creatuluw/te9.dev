<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import {
        Code,
        Package,
        Link2,
        Bookmark,
        FileText,
        Heart,
        type LucideIcon,
    } from "@lucide/svelte";

    const iconMap: Record<string, LucideIcon> = {
        code: Code,
        package: Package,
        link: Link2,
        bookmark: Bookmark,
        "file-text": FileText,
        heart: Heart,
    };

    function resolveIcon(name: string | undefined): LucideIcon | null {
        if (!name) return null;
        return iconMap[name] ?? null;
    }

    interface Props {
        title: string;
        description: string;
        tag: string;
        icon?: string;
        index: number;
    }

    let { title, description, tag, icon, index }: Props = $props();

    const resolvedIcon = $derived(resolveIcon(icon));
</script>

<article
    in:fly={{ y: 20, duration: 500, delay: index * 100 }}
    out:fade={{ duration: 200 }}
    class="garden-card"
>
    <div class="garden-card-accent"></div>
    <div class="card-content">
        <div class="garden-header">
            <h3 class="garden-title">{title}</h3>
            <div class="garden-icon">
                {#if resolvedIcon}
                    {@const Icon = resolvedIcon}
                    <Icon size={24} />
                {/if}
            </div>
        </div>
        <p class="garden-desc">{description}</p>
        <span class="garden-tag">{tag}</span>
    </div>
</article>

<style>
    .garden-card {
        position: relative;
        background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        border: 1px solid #2a2a2a;
        border-radius: 0;
        padding: 2rem;
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .garden-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #00ff88, #ff9500);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }

    .garden-card:hover::before {
        transform: scaleX(1);
    }

    .garden-card:hover {
        border-color: #333333;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .garden-card-accent {
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(
            circle,
            rgba(255, 149, 0, 0.03) 0%,
            transparent 70%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    .garden-card:hover .garden-card-accent {
        opacity: 1;
    }

    .card-content {
        position: relative;
        z-index: 10;
    }

    .garden-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .garden-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00ff88;
        flex-shrink: 0;
    }

    .garden-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #e8e8e8;
        margin: 0;
        font-family: "Bricolage Grotesque", sans-serif;
    }

    .garden-desc {
        font-size: 0.875rem;
        color: #888888;
        line-height: 1.6;
        margin: 0 0 1rem 0;
        font-family: "Lekton", monospace;
    }

    .garden-tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.6875rem;
        color: #00cc6a;
        background: rgba(0, 255, 136, 0.1);
        border-radius: 2px;
        font-family: "Lekton", monospace;
        text-transform: lowercase;
        letter-spacing: 0.05em;
    }

    @media (max-width: 768px) {
        .garden-card {
            padding: 1.5rem;
        }
    }
</style>
