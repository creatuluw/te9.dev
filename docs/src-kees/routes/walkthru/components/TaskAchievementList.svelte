<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { CheckCircle } from "lucide-svelte";

    interface Achievement {
        id: string;
        text: string;
        completed?: boolean;
    }

    interface Props {
        achievements: Achievement[];
        title?: string;
    }

    let { achievements, title = "Taak Achievements" }: Props = $props();
    const dispatch = createEventDispatcher();

    function handleItemClick(achievement: Achievement) {
        dispatch("itemclick", { achievement });
    }
</script>

<div class="task-achievement-list">
    {#if title}
        <h4 class="text-sm font-semibold text-zinc-700 mb-3">{title}</h4>
    {/if}

    <ul class="space-y-2">
        {#each achievements as achievement (achievement.id)}
            <li>
                <button
                    class="flex items-start gap-3 w-full text-left p-2 rounded-lg hover:bg-zinc-50 transition-colors"
                    class:bg-green-50={achievement.completed}
                    onclick={() => handleItemClick(achievement)}
                >
                    <CheckCircle
                        class="w-5 h-5 shrink-0 {achievement.completed
                            ? 'text-green-600'
                            : 'text-zinc-300'}"
                    />
                    <span
                        class="text-sm {achievement.completed
                            ? 'text-green-700'
                            : 'text-zinc-600'}"
                    >
                        {achievement.text}
                    </span>
                </button>
            </li>
        {/each}
    </ul>
</div>

<style>
    .task-achievement-list {
        @apply space-y-2;
    }
</style>
