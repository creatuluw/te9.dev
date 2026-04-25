<script lang="ts">
    import { onMount, tick } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";

    /**
     * Markdown component props
     *
     * Renders markdown content as HTML
     */
    interface Props {
        /**
         * Markdown content to render
         */
        content: string;

        /**
         * Additional CSS classes
         */
        class?: string;
    }

    let { content, class: className = "" }: Props = $props();

    // Create fallback HTML function
    function createFallbackHtml(text: string): string {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br />");
    }

    let renderedHtml = $state<string>("");
    let containerRef: HTMLDivElement | null = $state(null);

    // Always start with fallback HTML
    const fallbackHtml = $derived(createFallbackHtml(content));

    /** Post-process all anchor tags: add target="_blank" for external links */
    function postProcessLinks() {
        if (!containerRef) return;
        const links = containerRef.querySelectorAll("a");
        for (const link of links) {
            const href = link.getAttribute("href");
            if (!href) continue;

            if (href.startsWith("/")) {
                // Internal app route — use SvelteKit navigation
                link.href = href;
                link.removeAttribute("target");
                link.removeAttribute("rel");
                link.addEventListener("click", (e: Event) => {
                    e.preventDefault();
                    goto(href);
                });
            } else if (
                href.startsWith("http://") ||
                href.startsWith("https://")
            ) {
                // External URL — open in new tab
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        }
    }

    // Update when content changes
    $effect(() => {
        // Set fallback immediately so content shows right away
        renderedHtml = fallbackHtml;

        // Then try to render markdown if in browser
        if (browser && content) {
            (async () => {
                try {
                    const { marked } = await import("marked");
                    const html = marked.parse(content, {
                        breaks: true,
                        gfm: true,
                    }) as string;
                    if (html) {
                        renderedHtml = html;
                        await tick();
                        postProcessLinks();
                    }
                } catch (error) {
                    console.error("Failed to render markdown:", error);
                    // Keep fallback HTML
                }
            })();
        }
    });
</script>

<div bind:this={containerRef} class="markdown-content {className}">
    {@html renderedHtml || fallbackHtml}
</div>

<style>
    :global(.markdown-content) {
        font-size: 0.875rem;
        line-height: 1.625;
    }

    :global(.markdown-content p) {
        margin-bottom: 0.5rem;
    }

    :global(.markdown-content p:last-child) {
        margin-bottom: 0;
    }

    :global(.markdown-content h1),
    :global(.markdown-content h2),
    :global(.markdown-content h3),
    :global(.markdown-content h4),
    :global(.markdown-content h5),
    :global(.markdown-content h6) {
        font-weight: 600;
        font-family: "Aspekta", sans-serif;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }

    :global(.markdown-content h1:first-child),
    :global(.markdown-content h2:first-child),
    :global(.markdown-content h3:first-child),
    :global(.markdown-content h4:first-child),
    :global(.markdown-content h5:first-child),
    :global(.markdown-content h6:first-child) {
        margin-top: 0;
    }

    :global(.markdown-content h1) {
        font-size: 1.25rem;
        line-height: 1.75rem;
    }

    :global(.markdown-content h2) {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }

    :global(.markdown-content h3) {
        font-size: 1rem;
        line-height: 1.5rem;
    }

    :global(.markdown-content ul),
    :global(.markdown-content ol) {
        list-style-type: disc;
        list-style-position: inside;
        margin-bottom: 0.5rem;
        margin-left: 1rem;
    }

    :global(.markdown-content ol) {
        list-style-type: decimal;
    }

    :global(.markdown-content li) {
        margin-bottom: 0.25rem;
    }

    :global(.markdown-content code) {
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-family: "PT Mono", monospace;
    }

    :global(.markdown-content.text-white code) {
        background-color: rgb(39 39 42);
        color: rgb(244 244 245);
    }

    :global(.markdown-content:not(.text-white) code) {
        background-color: rgb(244 244 245);
        color: rgb(24 24 27);
    }

    :global(.markdown-content pre) {
        padding: 0.75rem;
        border-radius: 0.125rem;
        overflow-x: auto;
        margin-bottom: 0.5rem;
    }

    :global(.markdown-content.text-white pre) {
        background-color: rgb(39 39 42);
    }

    :global(.markdown-content:not(.text-white) pre) {
        background-color: rgb(244 244 245);
    }

    :global(.markdown-content pre code) {
        background-color: transparent;
        padding: 0;
    }

    :global(.markdown-content blockquote) {
        border-left: 4px solid rgb(212 212 216);
        padding-left: 1rem;
        font-style: italic;
        margin: 0.5rem 0;
    }

    :global(.markdown-content a) {
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
    }

    :global(.markdown-content.text-white a) {
        color: rgb(255 255 255);
    }

    :global(.markdown-content.text-white a:hover) {
        color: rgb(228 228 231);
    }

    :global(.markdown-content:not(.text-white) a) {
        color: rgb(37 99 235);
    }

    :global(.markdown-content:not(.text-white) a:hover) {
        color: rgb(29 78 216);
    }

    :global(.markdown-content strong) {
        font-weight: 600;
    }

    :global(.markdown-content em) {
        font-style: italic;
    }

    :global(.markdown-content hr) {
        border-top: 1px solid rgb(228 228 231);
        margin: 1rem 0;
    }

    :global(.markdown-content table) {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0.5rem;
    }

    :global(.markdown-content th),
    :global(.markdown-content td) {
        border: 1px solid rgb(212 212 216);
        padding: 0.5rem 0.75rem;
    }

    :global(.markdown-content th) {
        background-color: rgb(244 244 245);
        font-weight: 600;
    }
</style>
