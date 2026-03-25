<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import type { GardenCard } from "./types";

    interface Props {
        card: GardenCard;
        index: number;
    }

    let { card, index }: Props = $props();
</script>

<article
    in:fly={{ y: 20, duration: 500, delay: index * 100 }}
    out:fade={{ duration: 200 }}
    class="garden-card"
>
    <div class="garden-card-accent"></div>
    <div class="relative z-10">
        <div class="garden-icon">
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                {#each card.paths as path}
                    {#if "d" in path && path.d}
                        <path d={path.d} />
                    {:else if "rect" in path && path.rect}
                        <rect
                            x={path.rect.x}
                            y={path.rect.y}
                            width={path.rect.width}
                            height={path.rect.height}
                            rx={path.rect.rx}
                        />
                    {:else if "polyline" in path && path.polyline}
                        <polyline points={path.polyline.points} />
                    {:else if "line" in path && path.line}
                        <line
                            x1={path.line.x1}
                            y1={path.line.y1}
                            x2={path.line.x2}
                            y2={path.line.y2}
                        />
                    {:else if "circle" in path && path.circle}
                        <circle
                            cx={path.circle.cx}
                            cy={path.circle.cy}
                            r={path.circle.r}
                        />
                    {/if}
                {/each}
            </svg>
        </div>
        <h3 class="garden-title">{card.title}</h3>
        <p class="garden-desc">{card.desc}</p>
        <span class="garden-tag">{card.tag}</span>
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
        border-radius: 0;
        transform: translateY(-4px);
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

    .garden-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
        color: #00ff88;
    }

    .garden-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #e8e8e8;
        margin-bottom: 0.75rem;
        font-family: "Bricolage Grotesque", sans-serif;
    }

    .garden-desc {
        font-size: 0.875rem;
        color: #888888;
        line-height: 1.6;
        margin-bottom: 1rem;
    }

    .garden-tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.6875rem;
        color: #00cc6a;
        background: rgba(0, 255, 136, 0.1);
        border-radius: 2px;
        font-family: "JetBrains Mono", monospace;
        text-transform: lowercase;
        letter-spacing: 0.05em;
    }

    .relative {
        position: relative;
    }

    .z-10 {
        z-index: 10;
    }

    @media (max-width: 768px) {
        .garden-card {
            padding: 1.5rem;
        }
    }
</style>
