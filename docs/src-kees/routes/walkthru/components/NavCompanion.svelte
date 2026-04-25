<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Drawer, Button } from "$lib/components";
    import AppFlowDiagram from "./AppFlowDiagram.svelte";
    import { MapPin, X } from "lucide-svelte";
    import type { FlowNode, FlowEdge } from "../types";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        nodes: FlowNode[];
        edges: FlowEdge[];
        currentSlideId?: string;
        onNavigate?: (route: string) => void;
    }

    let { isOpen, onClose, nodes, edges, currentSlideId, onNavigate }: Props =
        $props();

    const dispatch = createEventDispatcher<{
        navigate: { route: string };
    }>();

    function handleNodeClick(
        event: CustomEvent<{ nodeId: string; node: FlowNode }>,
    ) {
        const route = event.detail.node.route;
        if (route) {
            dispatch("navigate", { route });
            if (onNavigate) {
                onNavigate(route);
            }
        }
    }
</script>

<Drawer
    open={isOpen}
    position="left"
    class="w-[50vw] max-w-[50vw] !overflow-hidden"
    onclose={onClose}
>
    <div class="flex flex-col h-full">
        <div
            class="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50"
        >
            <div class="flex items-center gap-2">
                <MapPin class="w-5 h-5 text-zinc-600" />
                <h2 class="text-lg font-semibold text-zinc-900">
                    App Navigatie
                </h2>
            </div>
            <Button variant="ghost" size="sm" onclick={onClose}>
                <X class="w-4 h-4" />
            </Button>
        </div>

        <div class="flex-1 overflow-hidden p-2">
            <AppFlowDiagram
                {nodes}
                {edges}
                {currentSlideId}
                onNodeClick={(nodeId: string) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    if (node) {
                        dispatch("navigate", { route: node.route });
                        if (onNavigate) {
                            onNavigate(node.route);
                        }
                    }
                }}
            />
        </div>

        <div class="p-3 border-t border-zinc-200 bg-zinc-50">
            <p class="text-xs text-zinc-500 text-center">
                Klik op een node om naar die sectie te navigeren
            </p>
        </div>
    </div>
</Drawer>
