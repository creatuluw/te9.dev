<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fly, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import { IconButton } from "$lib/components";
    import {
        Home,
        ArrowRight,
        ArrowLeft,
        Menu,
        Workflow,
        FileText,
        CheckSquare,
        List,
        Calendar,
        FolderOpen,
        ChartBar,
        Shield,
        Folder,
        MessageCircle,
        Eye,
        TrendingUp,
        Wrench,
        Target,
        Sparkles,
    } from "lucide-svelte";
    import RouteSlide from "./components/RouteSlide.svelte";
    import NavCompanion from "./components/NavCompanion.svelte";
    import AppFlowDiagram from "./components/AppFlowDiagram.svelte";
    import slides from "./slides.json";
    import type { WalkthruSlide, FlowNode, FlowEdge } from "./types";

    interface Props {
        data?: {
            slides: WalkthruSlide[];
            flowNodes: FlowNode[];
            flowEdges: FlowEdge[];
        };
    }

    let { data }: Props = $props();

    const iconMap: Record<string, any> = {
        Home,
        Workflow,
        FileText,
        CheckSquare,
        List,
        Calendar,
        FolderOpen,
        ChartBar,
        Shield,
        Folder,
        MessageCircle,
        Eye,
        TrendingUp,
        Wrench,
        Target,
        Sparkles,
    };

    const flowNodes: FlowNode[] = data?.flowNodes || [
        {
            id: "dashboard",
            label: "Dashboard",
            route: "/",
            description: "Centrale hub",
            jobs: ["Overzicht", "Drag & drop"],
            color: "#3b82f6",
            position: { x: 100, y: 100 },
        },
        {
            id: "processes",
            label: "Processen",
            route: "/processes",
            description: "Sjablonen",
            jobs: ["Definiëren", "Bouwen"],
            color: "#8b5cf6",
            position: { x: 300, y: 100 },
        },
        {
            id: "cases",
            label: "Cases",
            route: "/cases",
            description: "Uitvoeren",
            jobs: ["Starten", "Volgen"],
            color: "#22c55e",
            position: { x: 500, y: 100 },
        },
        {
            id: "work",
            label: "Werk",
            route: "/work",
            description: "Werkitems",
            jobs: ["Creëren", "Beheren"],
            color: "#f97316",
            position: { x: 300, y: 250 },
        },
        {
            id: "mijn-werk",
            label: "Mijn Werk",
            route: "/mijn-werk",
            description: "Planning",
            jobs: ["Plannen", "Balanceren"],
            color: "#14b8a6",
            position: { x: 500, y: 250 },
        },
        {
            id: "projects",
            label: "Projecten",
            route: "/projects",
            description: "Containers",
            jobs: ["Organiseren", "Archiveren"],
            color: "#6366f1",
            position: { x: 700, y: 100 },
        },
        {
            id: "messages",
            label: "Berichten",
            route: "/messages",
            description: "Messaging",
            jobs: ["Verzenden", "@noemen"],
            color: "#ec4899",
            position: { x: 100, y: 250 },
        },
        {
            id: "reports",
            label: "Rapporten",
            route: "/rapporten",
            description: "Analytics",
            jobs: ["Bekijken", "Volgen"],
            color: "#eab308",
            position: { x: 700, y: 250 },
        },
        {
            id: "admin",
            label: "Admin",
            route: "/admin",
            description: "Beheer",
            jobs: ["Beheren", "Configureren"],
            color: "#ef4444",
            position: { x: 100, y: 400 },
        },
        {
            id: "files",
            label: "Bestanden",
            route: "/files",
            description: "Bestanden",
            jobs: ["Uploaden", "Organiseren"],
            color: "#71717a",
            position: { x: 700, y: 400 },
        },
    ];

    const flowEdges: FlowEdge[] = data?.flowEdges || [
        {
            id: "e1",
            source: "processes",
            target: "cases",
            label: "Creëert",
            animated: true,
        },
        {
            id: "e2",
            source: "cases",
            target: "work",
            label: "Taken",
            animated: true,
        },
        {
            id: "e3",
            source: "work",
            target: "mijn-werk",
            label: "Planning",
            animated: true,
        },
        {
            id: "e4",
            source: "mijn-werk",
            target: "dashboard",
            label: "Dagelijks",
            animated: true,
        },
        {
            id: "e5",
            source: "dashboard",
            target: "reports",
            label: "Analyse",
            animated: true,
        },
        {
            id: "e6",
            source: "dashboard",
            target: "cases",
            label: "Start",
            animated: false,
        },
        {
            id: "e7",
            source: "cases",
            target: "projects",
            label: "Koppel",
            animated: false,
        },
        {
            id: "e8",
            source: "admin",
            target: "processes",
            label: "Beheert",
            animated: false,
        },
        {
            id: "e9",
            source: "messages",
            target: "dashboard",
            label: "Notificeert",
            animated: false,
        },
        {
            id: "e10",
            source: "files",
            target: "cases",
            label: "Bijlagen",
            animated: false,
        },
    ];

    const allSlides: WalkthruSlide[] =
        data?.slides || (slides as WalkthruSlide[]);

    let currentSlideIndex = $state(0);
    let isTransitioning = $state(false);
    let isNavOpen = $state(false);
    let isUpdatingFromUrl = $state(false);

    const currentSlide = $derived(allSlides[currentSlideIndex]);
    const totalSlides = $derived(allSlides.length);
    const progress = $derived(((currentSlideIndex + 1) / totalSlides) * 100);

    function updateUrl(index: number) {
        if (isUpdatingFromUrl) return;
        const newUrl = new URL($page.url);
        if (index === 0) {
            newUrl.searchParams.delete("slide");
        } else {
            newUrl.searchParams.set("slide", String(index + 1));
        }
        goto(newUrl.toString(), { replaceState: true, noScroll: true });
    }

    $effect(() => {
        const slideParam = $page.url.searchParams.get("slide");
        if (slideParam) {
            const index = parseInt(slideParam, 10) - 1;
            if (
                !isNaN(index) &&
                index >= 0 &&
                index < allSlides.length &&
                index !== currentSlideIndex
            ) {
                isUpdatingFromUrl = true;
                currentSlideIndex = index;
                setTimeout(() => {
                    isUpdatingFromUrl = false;
                }, 0);
            }
        } else if (currentSlideIndex !== 0) {
            isUpdatingFromUrl = true;
            currentSlideIndex = 0;
            setTimeout(() => {
                isUpdatingFromUrl = false;
            }, 0);
        }
    });

    function nextSlide() {
        if (isTransitioning || currentSlideIndex >= allSlides.length - 1)
            return;
        isTransitioning = true;
        currentSlideIndex++;
        updateUrl(currentSlideIndex);
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    function prevSlide() {
        if (isTransitioning || currentSlideIndex <= 0) return;
        isTransitioning = true;
        currentSlideIndex--;
        updateUrl(currentSlideIndex);
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    function goToSlide(index: number) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentSlideIndex = index;
        updateUrl(currentSlideIndex);
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    function handleNavigate(route: string) {
        const slideIndex = allSlides.findIndex((s) => s.route === route);
        if (slideIndex !== -1) {
            goToSlide(slideIndex);
        }
    }

    function toggleNav() {
        isNavOpen = !isNavOpen;
    }

    onMount(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                nextSlide();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                prevSlide();
            } else if (e.key === "m" && e.ctrlKey) {
                e.preventDefault();
                toggleNav();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    });
</script>

<svelte:head>
    <title>Walkthrough - kees.pippeloi.nl</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="walkthru-container">
    <!-- Progress Bar -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-zinc-200 z-10">
        <div
            class="h-full bg-zinc-900 transition-all duration-500 ease-out"
            style="width: {progress}%"
        ></div>
    </div>

    <!-- Nav Toggle Button -->
    <div class="absolute top-3 left-3 z-10">
        <IconButton
            icon={Menu}
            variant="ghost"
            size="sm"
            onclick={toggleNav}
            tooltip="Navigatiekaart openen (Ctrl+M)"
            class="bg-white/90 hover:bg-white"
        />
    </div>

    <!-- Slide Indicators -->
    <div class="absolute top-3 right-3 z-10 flex flex-wrap gap-1 max-w-xs">
        {#each allSlides as slide, index}
            <button
                onclick={() => goToSlide(index)}
                class="w-2 h-2 rounded-full transition-all duration-200 {currentSlideIndex ===
                index
                    ? 'bg-zinc-900 w-6'
                    : 'bg-zinc-300 hover:bg-zinc-400'}"
                aria-label="Slide {index + 1}"
            ></button>
        {/each}
    </div>

    <!-- Navigation Controls -->
    <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4"
    >
        <button
            onclick={prevSlide}
            disabled={currentSlideIndex === 0 || isTransitioning}
            class="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous"
        >
            <ArrowLeft class="w-5 h-5" />
        </button>

        <div
            class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm"
        >
            <span class="text-sm font-medium text-zinc-700">
                {currentSlideIndex + 1} / {totalSlides}
            </span>
        </div>

        <button
            onclick={nextSlide}
            disabled={currentSlideIndex >= allSlides.length - 1 ||
                isTransitioning}
            class="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next"
        >
            <ArrowRight class="w-5 h-5" />
        </button>
    </div>

    <!-- Slide Content -->
    <div class="slide-content">
        {#key currentSlideIndex}
            {#if currentSlide.type === "title"}
                <div
                    class="flex-1 flex items-center justify-center"
                    in:fly={{ y: 50, duration: 600, easing: quintOut }}
                    out:fade={{ duration: 300 }}
                >
                    <div class="text-center max-w-4xl mx-auto">
                        <h1
                            class="text-5xl md:text-6xl font-bold text-zinc-900 font-['Montserrat']"
                        >
                            {currentSlide.title}
                        </h1>
                        {#if currentSlide.subtitle}
                            <p class="text-xl md:text-2xl text-zinc-600 mt-2">
                                {currentSlide.subtitle}
                            </p>
                        {/if}
                        {#if currentSlide.content}
                            <p
                                class="text-lg text-zinc-700 mt-6 max-w-2xl mx-auto"
                            >
                                {currentSlide.content}
                            </p>
                        {/if}
                    </div>
                </div>
            {:else if currentSlide.type === "app-flow"}
                <div
                    class="flex-1 flex flex-col"
                    in:fly={{ x: 50, duration: 600, easing: quintOut }}
                    out:fade={{ duration: 300 }}
                >
                    <h2
                        class="text-2xl font-bold text-zinc-900 mb-2 text-center"
                    >
                        {currentSlide.title}
                    </h2>
                    <div
                        class="flex-1 bg-white rounded-lg border border-zinc-200 overflow-hidden"
                    >
                        <AppFlowDiagram
                            nodes={flowNodes}
                            edges={flowEdges}
                            currentSlideId={currentSlide.route}
                            onNodeClick={(nodeId: string) => {
                                const node = flowNodes.find(
                                    (n) => n.id === nodeId,
                                );
                                if (node) handleNavigate(node.route);
                            }}
                        />
                    </div>
                </div>
            {:else}
                <div
                    class="flex-1 flex flex-col"
                    in:fly={{ x: 50, duration: 600, easing: quintOut }}
                    out:fade={{ duration: 300 }}
                >
                    <RouteSlide
                        slide={currentSlide}
                        isActive={true}
                        onnavigate={(e) => handleNavigate(e.slideId)}
                    />
                </div>
            {/if}
        {/key}
    </div>

    <!-- Nav Companion -->
    <NavCompanion
        isOpen={isNavOpen}
        onClose={() => (isNavOpen = false)}
        nodes={flowNodes}
        edges={flowEdges}
        currentSlideId={currentSlide.route}
        onNavigate={(route: string) => handleNavigate(route)}
    />
</div>

<style>
    .walkthru-container {
        position: relative;
        height: 100%;
        width: 100%;
        background: #ffffff;
        overflow: hidden;
    }

    .slide-content {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        padding: 48px 48px 64px;
    }
</style>
