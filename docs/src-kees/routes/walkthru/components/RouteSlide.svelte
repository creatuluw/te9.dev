<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Home,
        Users,
        Workflow,
        FileText,
        CheckSquare,
        List,
        Calendar,
        FolderOpen,
        ChartBar,
        Settings,
        Shield,
        Eye,
        ArrowRight,
        Check,
    } from "lucide-svelte";
    import type { WalkthruSlide } from "../types";

    interface Props {
        slide: WalkthruSlide;
        isActive?: boolean;
        onnavigate?: (e: { slideId: string }) => void;
    }

    let { slide, isActive = false, onnavigate }: Props = $props();

    const dispatch = createEventDispatcher<{
        navigate: { slideId: string };
    }>();

    const iconMap: Record<string, any> = {
        Home,
        Users,
        Workflow,
        FileText,
        CheckSquare,
        List,
        Calendar,
        FolderOpen,
        ChartBar,
        Settings,
        Shield,
    };

    function handleNavigation(route: string) {
        dispatch("navigate", { slideId: route });
        onnavigate?.({ slideId: route });
    }
</script>

<div class="slide-container">
    <header class="header animate-in flex-shrink-0">
        <div class="header-left">
            <h1 class="header-title">{slide.title}</h1>
            {#if slide.route}
                <span class="badge">{slide.route}</span>
            {/if}
        </div>
        {#if slide.purpose}
            <p class="header-purpose">{slide.purpose}</p>
        {/if}
    </header>

    <div class="main-grid">
        {#if slide.problemsSolved && slide.problemsSolved.length > 0}
            <div class="section-container animate-in delay-1">
                <h2 class="section-title">Oplossingen</h2>
                <div class="content-scroll">
                    <div class="solutions-list">
                        {#each slide.problemsSolved as problem}
                            <div class="item-card solution-row">
                                <span class="before-text">{problem.before}</span
                                >
                                <span class="arrow-indicator">
                                    <ArrowRight class="w-3.5 h-3.5" />
                                </span>
                                <span class="after-text">{problem.after}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        {#if slide.taskAchievements && slide.taskAchievements.length > 0}
            <div class="section-container animate-in delay-2">
                <h2 class="section-title">Taken</h2>
                <div class="content-scroll">
                    <div class="tasks-grid">
                        {#each slide.taskAchievements as achievement}
                            <div class="item-card task-item">
                                <div class="task-check">
                                    <Check class="w-2 h-2" />
                                </div>
                                <span>{achievement}</span>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        {#if slide.features && slide.features.length > 0}
            <div class="section-container animate-in delay-3">
                <h2 class="section-title">Features</h2>
                <div class="content-scroll">
                    <div class="features-grid">
                        {#each slide.features as feature}
                            <div
                                class="item-card feature-item"
                                class:clickable={feature.link}
                                onclick={() =>
                                    feature.link &&
                                    handleNavigation(feature.link)}
                            >
                                <div class="feature-icon">
                                    <svelte:component
                                        this={iconMap[
                                            feature.icon || "Settings"
                                        ] || Settings}
                                        class="w-3.5 h-3.5"
                                    />
                                </div>
                                <div class="feature-name">{feature.name}</div>
                                <div class="feature-desc">
                                    {feature.description}
                                </div>
                                {#if feature.link}
                                    <span class="feature-link"
                                        >{feature.link}</span
                                    >
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    :root {
        --bg: #ffffff;
        --bg-subtle: #f9fafb;
        --border: #e5e7eb;
        --fg: #111827;
        --muted: #6b7280;
        --accent: #0f766e;
        --accent-light: #f0fdfa;
    }

    .slide-container {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(to bottom, #ffffff, #f9fafb);
        font-family:
            "Inter",
            -apple-system,
            sans-serif;
        color: var(--fg);
        line-height: 1.3;
        overflow: hidden;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-in {
        animation: fadeIn 0.4s ease-out forwards;
    }

    .delay-1 {
        animation-delay: 0.05s;
        opacity: 0;
    }

    .delay-2 {
        animation-delay: 0.1s;
        opacity: 0;
    }

    .delay-3 {
        animation-delay: 0.15s;
        opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .animate-in {
            animation: none;
            opacity: 1;
        }
    }

    .section-title {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--muted);
        margin-bottom: 8px;
    }

    .main-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        min-height: 0;
    }

    .section-container {
        display: flex;
        flex-direction: column;
        min-height: 0;
        background-color: var(--bg-subtle);
        border-radius: 10px;
        padding: 12px;
    }

    .content-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 4px;
    }

    .content-scroll::-webkit-scrollbar {
        width: 4px;
    }

    .content-scroll::-webkit-scrollbar-track {
        background: transparent;
    }

    .content-scroll::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 2px;
    }

    .item-card {
        background: white;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 10px 12px;
        transition: all 0.2s ease;
        min-height: auto;
        display: flex;
    }

    .item-card:hover {
        border-color: rgba(15, 118, 110, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transform: translateY(-1px);
    }

    .solutions-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .solution-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 10px;
        align-items: center;
        width: 100%;
    }

    .before-text {
        color: var(--muted);
        text-decoration: line-through;
        font-size: 13px;
    }

    .after-text {
        color: var(--fg);
        font-weight: 500;
        font-size: 13px;
    }

    .arrow-indicator {
        color: var(--accent);
        font-size: 14px;
        opacity: 0.6;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
    }

    .item-card:hover .arrow-indicator {
        opacity: 1;
    }

    .tasks-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .task-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        color: var(--fg);
        width: 100%;
    }

    .task-check {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 1.5px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
        background: white;
    }

    .task-item:hover .task-check {
        border-color: var(--accent);
        background: white;
    }

    .task-item:hover .task-check :global(svg) {
        opacity: 1;
    }

    .task-check :global(svg) {
        width: 9px;
        height: 9px;
        color: var(--accent);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .features-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .feature-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
    }

    .feature-item.clickable {
        cursor: pointer;
    }

    .feature-icon {
        width: 28px;
        height: 28px;
        border-radius: 5px;
        background: var(--bg-subtle);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
        margin-bottom: 10px;
        border: 1px solid var(--border);
    }

    .feature-name {
        font-weight: 600;
        font-size: 13px;
        color: var(--fg);
        margin-bottom: 3px;
    }

    .feature-desc {
        font-size: 11px;
        color: var(--muted);
        line-height: 1.3;
    }

    .feature-link {
        font-size: 11px;
        color: #2563eb;
        margin-top: 4px;
    }

    .feature-item.clickable:hover .feature-link {
        color: #1d4ed8;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        background: white;
        border: 1px solid var(--border);
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        color: var(--muted);
        font-family: ui-monospace, monospace;
    }

    .header {
        margin-bottom: 16px;
        padding: 16px 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .header-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.025em;
        margin: 0;
    }

    .header-purpose {
        font-size: 14px;
        color: var(--muted);
        margin: 0;
    }
</style>
