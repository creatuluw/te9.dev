<script lang="ts">
    import Markdown from "$lib/components/Markdown.svelte";
    import { ArrowLeft, ChevronRight, BookOpen } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const { guide } = data;
    const { meta, content } = guide;
</script>

<svelte:head>
    <title>{meta.title} - Handleidingen - Pippeloi</title>
    <meta name="description" content={meta.description} />
</svelte:head>

<div class="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
    <nav class="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <a href="/guides" class="hover:text-orange-500 transition-colors flex items-center gap-1">
            <BookOpen size={14} />
            <span>Handleidingen</span>
        </a>
        <ChevronRight size={14} class="text-zinc-300" />
        <span class="text-zinc-900 font-medium">{meta.title}</span>
    </nav>

    <div class="bg-white rounded-lg border border-zinc-200 p-6 md:p-8 lg:p-10">
        <Markdown content={content} />
    </div>

    <div class="mt-6">
        <a
            href="/guides"
            class="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-500 transition-colors"
        >
            <ArrowLeft size={16} />
            Terug naar handleidingen
        </a>
    </div>
</div>
