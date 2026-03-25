<script lang="ts">
    import "../app.css";
    import favicon from "$lib/assets/favicon.svg";
    import Header from "$lib/components/ui/Header.svelte";
    import Footer from "$lib/components/ui/Footer.svelte";
    import BackgroundEffects from "$lib/components/ui/BackgroundEffects.svelte";
    import { onNavigate } from "$app/navigation";

    let { children } = $props();

    const transitions = [
        "slide",
        "zoom",
        "scale",
        "drop",
        "swipe",
        "rotate",
        "flip",
        "curtain",
        "blur",
        "explode",
    ];

    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        const randomTransition =
            transitions[Math.floor(Math.random() * transitions.length)];

        // Add transition class to root element
        document.documentElement.classList.add(
            `transition-${randomTransition}`,
        );

        return new Promise((resolve) => {
            document
                .startViewTransition(async () => {
                    resolve();
                    await navigation.complete;
                })
                .finished.then(() => {
                    // Clean up class after transition completes
                    document.documentElement.classList.remove(
                        `transition-${randomTransition}`,
                    );
                });
        });
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<BackgroundEffects />
<Header />

<main class="pt-[60px]">
    {@render children()}
</main>

<Footer />
