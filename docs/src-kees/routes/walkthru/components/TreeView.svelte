<script lang="ts">
    import { createEventDispatcher } from "svelte";

    interface TreeNode {
        id: string;
        label: string;
        children?: TreeNode[];
    }

    interface Props {
        node: TreeNode;
        defaultOpen?: boolean;
        level?: number;
    }

    let { node, defaultOpen = false, level = 0 }: Props = $props();

    const dispatch = createEventDispatcher();

    let isOpen = $state(defaultOpen);
    let indent = $derived(level * 16);

    function toggle() {
        isOpen = !isOpen;
    }
</script>

{#if node.children && node.children.length > 0}
    <div class="tree-node" style="padding-left: {indent}px">
        <button
            class="flex items-center gap-2 w-full text-left py-1.5 hover:bg-zinc-100 rounded-md transition-colors"
            onclick={toggle}
        >
            <span
                class="transform transition-transform duration-200 text-zinc-400 {isOpen
                    ? 'rotate-90 text-zinc-600'
                    : ''}"
                aria-hidden="true"
            >
                ▼
            </span>
            <span class="font-medium text-zinc-900">{node.label}</span>
        </button>

        {#if isOpen}
            <div class="overflow-hidden transition-all duration-300 ml-4">
                {#each node.children as child (child.id)}
                    <svelte:self node={child} level={level + 1} />
                {/each}
            </div>
        {/if}
    </div>
{:else}
    <div class="py-1.5 text-zinc-500 text-sm" style="padding-left: {indent}px">
        {node.label}
    </div>
{/if}

<style>
    .tree-node {
        position: relative;
    }
</style>
