<script lang="ts">
    import {
        Home,
        Workflow,
        Folder,
        Briefcase,
        LifeBuoy,
        User,
        Mail,
        ChevronRight,
        BookOpen,
    } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const iconMap: Record<string, typeof Home> = {
        home: Home,
        workflow: Workflow,
        folder: Folder,
        briefcase: Briefcase,
        "life-buoy": LifeBuoy,
        user: User,
        mail: Mail,
    };
</script>

<svelte:head>
    <title>Handleidingen - Pippeloi</title>
    <meta name="description" content="Handleidingen voor het gebruik van Pippeloi" />
</svelte:head>

<div class="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
    <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
            <BookOpen size={28} class="text-orange-500" />
            <h1 class="text-2xl font-semibold font-aspekta text-zinc-900">Handleidingen</h1>
        </div>
        <p class="text-zinc-500 text-sm">
            Stap-voor-stap handleidingen voor alle onderdelen van Pippeloi. Klik op een handleiding om te beginnen.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each data.guides as guide}
            {@const IconComponent = iconMap[guide.icon] || Home}
            <a
                href="/guides/{guide.slug}"
                class="group block bg-white rounded-lg border border-zinc-200 p-5 hover:border-orange-300 hover:shadow-md transition-all duration-200"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors"
                    >
                        <IconComponent size={20} class="text-orange-500" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2
                            class="text-base font-semibold text-zinc-900 group-hover:text-orange-600 transition-colors"
                        >
                            {guide.title}
                        </h2>
                        <p class="mt-1 text-sm text-zinc-500 line-clamp-2">
                            {guide.description}
                        </p>
                    </div>
                    <ChevronRight
                        size={18}
                        class="flex-shrink-0 mt-1 text-zinc-300 group-hover:text-orange-400 transition-colors"
                    />
                </div>
                <div class="mt-4 flex flex-wrap gap-1.5">
                    {#each guide.tasks as task}
                        <span
                            class="inline-block text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600"
                        >
                            {task}
                        </span>
                    {/each}
                </div>
            </a>
        {/each}
    </div>
</div>
