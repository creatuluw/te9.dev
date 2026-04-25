<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ExternalLink } from "lucide-svelte";
    import type { SlideFeature } from "../types";
    import Button from "$lib/components/Button.svelte";

    interface Props {
        features: SlideFeature[];
        currentSlideId?: string;
    }

    let { features, currentSlideId }: Props = $props();
    const dispatch = createEventDispatcher<{
        feature: SlideFeature;
    }>();

    function handleFeatureClick(feature: SlideFeature) {
        dispatch("feature", feature);
    }

    function openRoute(route: string) {
        window.open(route, "_blank");
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each features as feature (feature.name)}
        <button
            class="flex flex-col items-start p-4 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md hover:border-primary-600 transition-all text-left {currentSlideId ===
            feature.link
                ? 'ring-2 ring-primary-500 border-primary-500'
                : ''}"
            onclick={() => handleFeatureClick(feature)}
        >
            <div class="flex items-center gap-2 mb-2">
                <div class="p-1.5 rounded-md bg-zinc-100 text-zinc-600">
                    <ExternalLink class="w-4 h-4" />
                </div>
                <h4 class="font-medium text-zinc-900 text-sm">
                    {feature.name}
                </h4>
            </div>
            <p class="text-xs text-zinc-600 mb-3 line-clamp-2">
                {feature.description}
            </p>
            <div class="mt-3 flex items-center justify-between">
                <span
                    class="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded"
                >
                    {feature.link}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => openRoute(feature.link)}
                >
                    Open
                </Button>
            </div>
        </button>
    {/each}
</div>

<style>
    .feature-card {
        min-height: 120px;
    }
</style>
