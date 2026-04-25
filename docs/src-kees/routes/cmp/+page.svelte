<script lang="ts">
    import {
        Button,
        ButtonGroup,
        Label,
        Alert,
        Select,
        DatePicker,
        Accordion,
        Tabs,
        Drawer,
        Modal,
        Breadcrumb,
        ToastContainer,
        DropdownNav,
        Skeleton,
        IconButton,
        Pagination,
        ProgressBar,
        Rating,
        StepsProgress,
        SpeedDial,
        Toggle,
        RadioGroup,
        CheckboxGroup,
        FileUpload,
        FileList,
        SearchFilterPanel,
        Mermaid,
        Nomnoml,
        SvelteFlow,
        HeatmapTable,
        ErrorPage,
    } from "$lib/components";
    import type { Node, Edge } from "@xyflow/svelte";
    import { MarkerType } from "@xyflow/svelte";
    import { CardNode, ListNode } from "$lib/components";
    import { toastStore } from "$lib/stores/toastStore";
    import {
        List,
        Share,
        Printer,
        Download,
        Copy,
        Trash2,
        Save,
        Mail,
        Blocks,
    } from "lucide-svelte";

    let drawerOpen = $state(false);
    let drawerPosition = $state<"left" | "right" | "top" | "bottom">("right");
    let tocDrawerOpen = $state(false);
    let modalOpen = $state(false);
    let modalSize = $state<"sm" | "md" | "lg">("md");
    let selectedValue = $state("");
    let activeFilter = $state("all");
    let selectedDate = $state<string | null>(null);
    let minDate = $state<string | undefined>(undefined);
    let maxDate = $state<string | undefined>(undefined);
    let currentPage = $state(1);
    let currentPage2 = $state(5);
    let currentPage3 = $state(1);
    let progressValue = $state(37.5);
    let ratingValue = $state(4);
    let currentStep = $state(2);
    let toggleEnabled = $state(false);
    let toggleNotifications = $state(true);
    let notificationMethod = $state("email");
    let preferenceOption = $state("option1");
    let statusValue = $state("active");
    let selectedNotifications = $state<string[]>(["email"]);
    let selectedPreferences = $state<string[]>(["option1"]);
    let selectedStatuses = $state<string[]>(["active"]);
    let searchPanelOpen = $state(false);
    let searchPanelOpen2 = $state(false);

    // SvelteFlow examples state

    // Node types for examples
    const svelteFlowNodeTypes = {
        card: CardNode,
        list: ListNode,
    } as any;

    // Feature Overview - comprehensive example with various node types
    let overviewNodes = $state<Node[]>([
        {
            id: "1",
            type: "input",
            position: { x: 0, y: 0 },
            data: { label: "Input Node" },
        },
        {
            id: "2",
            position: { x: 200, y: 0 },
            data: { label: "Default Node" },
        },
        {
            id: "3",
            type: "output",
            position: { x: 400, y: 0 },
            data: { label: "Output Node" },
        },
        { id: "4", position: { x: 100, y: 150 }, data: { label: "Node A" } },
        { id: "5", position: { x: 300, y: 150 }, data: { label: "Node B" } },
    ]);
    let overviewEdges = $state<Edge[]>([
        {
            id: "e1-2",
            source: "1",
            target: "2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        },
        {
            id: "e2-4",
            source: "2",
            target: "4",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        },
        {
            id: "e2-5",
            source: "2",
            target: "5",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        },
    ]);

    // Context Menu example
    let contextMenuNodes = $state<Node[]>([
        {
            id: "ctx-1",
            type: "card",
            position: { x: 100, y: 100 },
            data: {
                title: "Card Node 1",
                description: "Right-click me!\nTry context menu actions",
                variant: "default",
            },
        },
        {
            id: "ctx-2",
            type: "card",
            position: { x: 300, y: 100 },
            data: {
                title: "Card Node 2",
                description: "Or me!\nInteractive example",
                variant: "info",
            },
        },
        {
            id: "ctx-3",
            type: "card",
            position: { x: 200, y: 250 },
            data: {
                title: "Card Node 3",
                description: "Try right-clicking nodes\nto see context menus",
                variant: "stat",
            },
        },
    ]);
    let contextMenuEdges = $state<Edge[]>([
        {
            id: "ctx-e1",
            source: "ctx-1",
            target: "ctx-2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Connected",
        },
        {
            id: "ctx-e2",
            source: "ctx-2",
            target: "ctx-3",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Connected",
        },
    ]);
    let contextMenuState = $state<{
        id: string;
        top?: number;
        left?: number;
        right?: number;
        bottom?: number;
    } | null>(null);

    function handleNodeContextMenu(event: MouseEvent, node: Node) {
        event.preventDefault();
        const clientWidth = window.innerWidth;
        const clientHeight = window.innerHeight;
        contextMenuState = {
            id: node.id,
            top: event.clientY < clientHeight - 200 ? event.clientY : undefined,
            left: event.clientX < clientWidth - 200 ? event.clientX : undefined,
            right:
                event.clientX >= clientWidth - 200
                    ? clientWidth - event.clientX
                    : undefined,
            bottom:
                event.clientY >= clientHeight - 200
                    ? clientHeight - event.clientY
                    : undefined,
        };
    }

    function closeContextMenu() {
        contextMenuState = null;
    }

    // Dagre layout example - hierarchical workflow
    let dagreNodes = $state<Node[]>([
        {
            id: "d1",
            type: "card",
            position: { x: 0, y: 0 },
            data: {
                title: "Start Process",
                description: "Workflow begins here",
                variant: "default",
                targetHandle: false,
                sourcePosition: "right",
            },
        },
        {
            id: "d2",
            type: "card",
            position: { x: 0, y: 0 },
            data: {
                title: "Task A",
                description: "First parallel task",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "d3",
            type: "card",
            position: { x: 0, y: 0 },
            data: {
                title: "Task B",
                description: "Second parallel task",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "d4",
            type: "card",
            position: { x: 0, y: 0 },
            data: {
                title: "Task C",
                description: "Depends on Task A",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "d5",
            type: "card",
            position: { x: 0, y: 0 },
            data: {
                title: "End Process",
                description: "Workflow completes",
                variant: "default",
                targetPosition: "left",
                sourceHandle: false,
            },
        },
    ]);
    let dagreEdges = $state<Edge[]>([
        {
            id: "de1",
            source: "d1",
            target: "d2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Start",
        },
        {
            id: "de2",
            source: "d1",
            target: "d3",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Start",
        },
        {
            id: "de3",
            source: "d2",
            target: "d4",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Depends on",
        },
        {
            id: "de4",
            source: "d3",
            target: "d5",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Complete",
        },
        {
            id: "de5",
            source: "d4",
            target: "d5",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Complete",
        },
    ]);

    // Horizontal Flow example - linear workflow
    let horizontalNodes = $state<Node[]>([
        {
            id: "h1",
            type: "card",
            position: { x: 0, y: 100 },
            data: {
                title: "Start",
                description: "Initial state",
                variant: "default",
                targetHandle: false,
                sourcePosition: "right",
            },
        },
        {
            id: "h2",
            type: "card",
            position: { x: 200, y: 100 },
            data: {
                title: "Step 1",
                description: "First processing step",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "h3",
            type: "card",
            position: { x: 400, y: 100 },
            data: {
                title: "Step 2",
                description: "Second processing step",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "h4",
            type: "card",
            position: { x: 600, y: 100 },
            data: {
                title: "End",
                description: "Final state",
                variant: "default",
                targetPosition: "left",
                sourceHandle: false,
            },
        },
    ]);
    let horizontalEdges = $state<Edge[]>([
        {
            id: "he1",
            source: "h1",
            target: "h2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            animated: true,
        },
        {
            id: "he2",
            source: "h2",
            target: "h3",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            animated: true,
        },
        {
            id: "he3",
            source: "h3",
            target: "h4",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            animated: true,
        },
    ]);

    // Tailwind styled example - custom variants
    let tailwindNodes = $state<Node[]>([
        {
            id: "t1",
            type: "card",
            position: { x: 100, y: 100 },
            data: {
                title: "Info Node",
                description: "Information card\nwith blue accent",
                variant: "info",
                targetHandle: false,
                sourcePosition: "right",
            },
        },
        {
            id: "t2",
            type: "card",
            position: { x: 300, y: 100 },
            data: {
                title: "Success Node",
                description: "Success card\nwith green accent",
                variant: "success",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "t3",
            type: "card",
            position: { x: 500, y: 100 },
            data: {
                title: "Warning Node",
                description: "Warning card\nwith yellow accent",
                variant: "warning",
                targetPosition: "left",
                sourceHandle: false,
            },
        },
    ]);
    let tailwindEdges = $state<Edge[]>([
        {
            id: "te1",
            source: "t1",
            target: "t2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: "stroke: rgb(59 130 246)", // blue to match info variant
        },
        {
            id: "te2",
            source: "t2",
            target: "t3",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: "stroke: rgb(34 197 94)", // green to match success variant
        },
    ]);

    // Different edge types example
    let threlteNodes = $state<Node[]>([
        {
            id: "th1",
            type: "card",
            position: { x: 100, y: 100 },
            data: {
                title: "Node 1",
                description: "Smoothstep edge",
                variant: "default",
                targetHandle: false,
                sourcePosition: "right",
            },
        },
        {
            id: "th2",
            type: "card",
            position: { x: 300, y: 100 },
            data: {
                title: "Node 2",
                description: "Bezier edge",
                variant: "default",
                targetPosition: "left",
                sourcePosition: "right",
            },
        },
        {
            id: "th3",
            type: "card",
            position: { x: 500, y: 100 },
            data: {
                title: "Node 3",
                description: "Step edge",
                variant: "default",
                targetPosition: "left",
                sourceHandle: false,
            },
        },
    ]);
    let threlteEdges = $state<Edge[]>([
        {
            id: "the1",
            source: "th1",
            target: "th2",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Smoothstep",
        },
        {
            id: "the2",
            source: "th2",
            target: "th3",
            type: "step",
            markerEnd: { type: MarkerType.ArrowClosed },
            label: "Step",
        },
    ]);

    // SvelteFlow tab items
    const svelteFlowTabs = [
        { id: "overview", label: "Feature Overview" },
        { id: "context-menu", label: "Context Menu" },
        { id: "dagre", label: "Hierarchical Layout" },
        { id: "horizontal", label: "Horizontal Flow" },
        { id: "tailwind", label: "Card Variants" },
        { id: "threlte", label: "Edge Types" },
    ];

    // Table of Contents data
    const tocItems = [
        { id: "breadcrumb", label: "Breadcrumb" },
        { id: "button", label: "Button" },
        { id: "button-group", label: "ButtonGroup" },
        { id: "pagination", label: "Pagination" },
        { id: "label", label: "Label" },
        { id: "alert", label: "Alert" },
        { id: "errorpage", label: "ErrorPage" },
        { id: "skeleton", label: "Skeleton" },
        { id: "progressbar", label: "ProgressBar" },
        { id: "rating", label: "Rating" },
        { id: "steps-progress", label: "StepsProgress" },
        { id: "select", label: "Select" },
        { id: "datepicker", label: "DatePicker" },
        { id: "dropdownnav", label: "DropdownNav" },
        { id: "toast", label: "Toast" },
        { id: "accordion", label: "Accordion" },
        { id: "tabs", label: "Tabs" },
        { id: "drawer", label: "Drawer" },
        { id: "modal", label: "Modal" },
        { id: "speed-dial", label: "SpeedDial" },
        { id: "toggle", label: "Toggle" },
        { id: "radio-group", label: "RadioGroup" },
        { id: "checkbox-group", label: "CheckboxGroup" },
        { id: "file-upload", label: "FileUpload" },
        { id: "file-list", label: "FileList" },
        { id: "search-filter-panel", label: "SearchFilterPanel" },
        { id: "mermaid", label: "Mermaid" },
        { id: "nomnoml", label: "Nomnoml" },
        { id: "svelteflow", label: "SvelteFlow" },
        { id: "heatmap-table", label: "HeatmapTable" },
        { id: "additional-components", label: "Additional Components" },
        { id: "component-usage", label: "Component Usage" },
    ];

    function scrollToSection(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            // Close drawer after a short delay to allow scroll to start
            setTimeout(() => {
                tocDrawerOpen = false;
            }, 100);
        }
    }

    const selectOptions = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3", disabled: true },
        { value: "option4", label: "Option 4" },
    ];

    const accordionItems = [
        {
            id: "item1",
            title: "What is this component library?",
            content:
                "This is a showcase of all available UI components built with SvelteKit and TailwindCSS, following the gray-html design system.",
        },
        {
            id: "item2",
            title: "How do I use these components?",
            content:
                "Import components from $lib/components. Each component has props documented in their respective .md files and can be used throughout your application.",
        },
        {
            id: "item3",
            title: "Are these components customizable?",
            content:
                "Yes! All components accept custom className props and can be styled to match your design needs while maintaining the core design system.",
        },
    ];

    const tabItems = [
        { id: "tab1", label: "Overview" },
        { id: "tab2", label: "Features" },
        { id: "tab3", label: "Usage" },
    ];

    const dropdownItems = [
        { label: "Analytics", href: "/analytics" },
        { label: "Engagement", href: "/engagement" },
        { label: "Security", href: "/security" },
        { label: "Integrations", href: "/integrations" },
        { label: "Automations", href: "/automations" },
        { label: "Reports", href: "/reports" },
    ];

    function showToast(variant: "success" | "error" | "warning" | "info") {
        const messages = {
            success: "Success! This is a success toast notification.",
            error: "Error! This is an error toast notification.",
            warning: "Warning! This is a warning toast notification.",
            info: "Info: This is an informational toast notification.",
        };
        toastStore.add(messages[variant], variant, 5000);
    }

    function openDrawer(position: "left" | "right" | "top" | "bottom") {
        drawerPosition = position;
        drawerOpen = true;
    }

    function openModal(size: "sm" | "md" | "lg") {
        modalSize = size;
        modalOpen = true;
    }
</script>

<svelte:head>
    <title>Component Showcase</title>
    <meta
        name="description"
        content="Showcase of all available UI components"
    />
</svelte:head>

<ToastContainer position="top-right" />

<!-- Table of Contents Button - fixed below header and breadcrumb, aligned with logo -->
<div class="fixed top-[88px] left-0 px-8 z-50">
    <IconButton
        icon={List}
        onclick={() => (tocDrawerOpen = true)}
        tooltip="Open Table of Contents"
        variant="ghost"
        size="lg"
    />
</div>

<div class="h-full overflow-y-auto overflow-x-hidden">
    <div class="max-w-7xl mx-auto px-8 py-12 space-y-16 relative">
        <!-- Header -->
        <div class="space-y-4">
            <h1 class="text-4xl font-bold text-zinc-900 font-aspekta">
                Component Showcase
            </h1>
            <p class="text-zinc-600 text-lg">
                This page showcases all available UI components from the
                component library. Use this as a reference for component usage,
                props, and examples.
            </p>
        </div>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Table of Contents Drawer -->
        <Drawer bind:open={tocDrawerOpen} position="left" class="w-80">
            <div class="flex flex-col h-full min-w-0">
                <!-- Header - Fixed -->
                <h2
                    class="text-xl font-semibold text-zinc-900 font-aspekta mb-6"
                >
                    Table of Contents
                </h2>
                <!-- Content - Scrollable -->
                <nav class="flex-1 overflow-y-auto min-w-0">
                    <ul class="space-y-1">
                        {#each tocItems as item}
                            <li>
                                <button
                                    onclick={() => scrollToSection(item.id)}
                                    class="w-full text-left px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                >
                                    {item.label}
                                </button>
                            </li>
                        {/each}
                    </ul>
                </nav>
            </div>
        </Drawer>

        <!-- Breadcrumb Component -->
        <section id="breadcrumb" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Breadcrumb
                    </h2>
                    <p class="text-zinc-600">
                        Navigation breadcrumb component showing the current page
                        hierarchy.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <Breadcrumb
                        items={[
                            { label: "Home", href: "/" },
                            { label: "Components", href: "/cmp" },
                            { label: "Current Page" },
                        ]}
                    />
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Button Component -->
        <section id="button" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Button
                    </h2>
                    <p class="text-zinc-600">
                        Versatile button component with multiple variants and
                        sizes.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Variants
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="outline">Outline</Button>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">Sizes</h3>
                        <div class="flex flex-wrap gap-3 items-center">
                            <Button size="default">Default Size</Button>
                            <Button size="sm">Small</Button>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            States
                        </h3>
                        <div class="flex flex-wrap gap-3">
                            <Button>Normal</Button>
                            <Button disabled>Disabled</Button>
                            <Button fullWidth>Full Width Button</Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- ButtonGroup Component -->
        <section id="button-group" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        ButtonGroup
                    </h2>
                    <p class="text-zinc-600">
                        Container component for grouping buttons together with
                        shared borders and rounded corners.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Button Group
                        </h3>
                        <ButtonGroup>
                            <Button
                                variant="secondary"
                                class="button-group-item">Profile</Button
                            >
                            <Button
                                variant="secondary"
                                class="button-group-item">Settings</Button
                            >
                            <Button
                                variant="secondary"
                                class="button-group-item">Messages</Button
                            >
                        </ButtonGroup>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Different Variants
                        </h3>
                        <div class="space-y-3">
                            <ButtonGroup>
                                <Button
                                    variant="outline"
                                    class="button-group-item">Edit</Button
                                >
                                <Button
                                    variant="outline"
                                    class="button-group-item">Share</Button
                                >
                                <Button
                                    variant="outline"
                                    class="button-group-item">Delete</Button
                                >
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button
                                    variant="ghost"
                                    class="button-group-item">Today</Button
                                >
                                <Button
                                    variant="ghost"
                                    class="button-group-item">Week</Button
                                >
                                <Button
                                    variant="ghost"
                                    class="button-group-item">Month</Button
                                >
                            </ButtonGroup>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Small Size
                        </h3>
                        <ButtonGroup>
                            <Button
                                size="sm"
                                variant="secondary"
                                class="button-group-item">Today</Button
                            >
                            <Button
                                size="sm"
                                variant="secondary"
                                class="button-group-item">Week</Button
                            >
                            <Button
                                size="sm"
                                variant="secondary"
                                class="button-group-item">Month</Button
                            >
                        </ButtonGroup>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Filter/Status Toggle
                        </h3>
                        <ButtonGroup>
                            <Button
                                variant={activeFilter === "all"
                                    ? "default"
                                    : "secondary"}
                                class="button-group-item"
                                onclick={() => (activeFilter = "all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={activeFilter === "active"
                                    ? "default"
                                    : "secondary"}
                                class="button-group-item"
                                onclick={() => (activeFilter = "active")}
                            >
                                Active
                            </Button>
                            <Button
                                variant={activeFilter === "completed"
                                    ? "default"
                                    : "secondary"}
                                class="button-group-item"
                                onclick={() => (activeFilter = "completed")}
                            >
                                Completed
                            </Button>
                        </ButtonGroup>
                        <p class="text-xs text-zinc-500">
                            Selected: <strong>{activeFilter}</strong>
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Two Buttons
                        </h3>
                        <ButtonGroup>
                            <Button
                                variant="secondary"
                                class="button-group-item">Previous</Button
                            >
                            <Button
                                variant="secondary"
                                class="button-group-item">Next</Button
                            >
                        </ButtonGroup>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Pagination Component -->
        <section id="pagination" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Pagination
                    </h2>
                    <p class="text-zinc-600">
                        Pagination component with smart page number rendering,
                        responsive mobile/desktop views, and item count
                        information.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <Pagination
                            {currentPage}
                            totalItems={97}
                            itemsPerPage={10}
                            onPageChange={(page) => (currentPage = page)}
                        />
                        <p class="text-xs text-zinc-500">
                            Current page: <strong>{currentPage}</strong>
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Large Page Count (Ellipsis)
                        </h3>
                        <Pagination
                            currentPage={currentPage2}
                            totalItems={250}
                            itemsPerPage={10}
                            onPageChange={(page) => (currentPage2 = page)}
                        />
                        <p class="text-xs text-zinc-500">
                            Current page: <strong>{currentPage2}</strong> of 25
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Small Page Count
                        </h3>
                        <Pagination
                            currentPage={currentPage3}
                            totalItems={50}
                            itemsPerPage={10}
                            onPageChange={(page) => (currentPage3 = page)}
                        />
                        <p class="text-xs text-zinc-500">
                            Current page: <strong>{currentPage3}</strong> of 5
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Custom Items Per Page
                        </h3>
                        <Pagination
                            currentPage={1}
                            totalItems={156}
                            itemsPerPage={25}
                            onPageChange={(page) =>
                                console.log("Page changed to:", page)}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Label Component -->
        <section id="label" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Label
                    </h2>
                    <p class="text-zinc-600">
                        Badge-like label component with different variants for
                        status indication.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <div class="flex flex-wrap gap-3">
                        <Label>Default</Label>
                        <Label variant="success">Success</Label>
                        <Label variant="warning">Warning</Label>
                        <Label variant="danger">Danger</Label>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Alert Component -->
        <section id="alert" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Alert
                    </h2>
                    <p class="text-zinc-600">
                        Alert component for displaying informational, success,
                        warning, error, and neutral messages.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Variants
                        </h3>
                        <div class="space-y-4">
                            <Alert variant="info">
                                Info alert! Change a few things up and try
                                submitting again.
                            </Alert>
                            <Alert variant="danger">
                                Danger alert! Change a few things up and try
                                submitting again.
                            </Alert>
                            <Alert variant="success">
                                Success alert! Change a few things up and try
                                submitting again.
                            </Alert>
                            <Alert variant="warning">
                                Warning alert! Change a few things up and try
                                submitting again.
                            </Alert>
                            <Alert variant="dark">
                                Dark alert! Change a few things up and try
                                submitting again.
                            </Alert>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- ErrorPage Component -->
        <section id="errorpage" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        ErrorPage
                    </h2>
                    <p class="text-zinc-600">
                        Full-page error component for displaying various error
                        states (404, 403, 500, etc.) with consistent styling.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg overflow-hidden">
                    <div class="space-y-0 divide-y divide-zinc-200">
                        <!-- 404 Example -->
                        <div class="p-6 bg-white">
                            <h3 class="text-sm font-medium text-zinc-700 mb-4">
                                404 - Not Found
                            </h3>
                            <div
                                class="border border-zinc-200 rounded-lg overflow-hidden max-h-96"
                            >
                                <div
                                    class="scale-50 origin-top-left w-[200%] h-[200%]"
                                >
                                    <ErrorPage
                                        code={404}
                                        title="Pagina niet gevonden"
                                        message="Sorry, we kunnen de pagina die u zoekt niet vinden."
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- 403 Example -->
                        <div class="p-6 bg-white">
                            <h3 class="text-sm font-medium text-zinc-700 mb-4">
                                403 - Forbidden
                            </h3>
                            <div
                                class="border border-zinc-200 rounded-lg overflow-hidden max-h-96"
                            >
                                <div
                                    class="scale-50 origin-top-left w-[200%] h-[200%]"
                                >
                                    <ErrorPage
                                        code={403}
                                        title="Geen toegang"
                                        message="U heeft geen toegang tot deze pagina. Neem contact op met de systeembeheerder."
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- 500 Example -->
                        <div class="p-6 bg-white">
                            <h3 class="text-sm font-medium text-zinc-700 mb-4">
                                500 - Server Error
                            </h3>
                            <div
                                class="border border-zinc-200 rounded-lg overflow-hidden max-h-96"
                            >
                                <div
                                    class="scale-50 origin-top-left w-[200%] h-[200%]"
                                >
                                    <ErrorPage
                                        code={500}
                                        title="Er ging iets mis"
                                        message="Er is een onverwachte fout opgetreden op de server. Probeer het later opnieuw."
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Custom Example -->
                        <div class="p-6 bg-white">
                            <h3 class="text-sm font-medium text-zinc-700 mb-4">
                                Custom Error
                            </h3>
                            <div
                                class="border border-zinc-200 rounded-lg overflow-hidden max-h-96"
                            >
                                <div
                                    class="scale-50 origin-top-left w-[200%] h-[200%]"
                                >
                                    <ErrorPage
                                        code="Onderhoud"
                                        title="Site in onderhoud"
                                        message="We zijn bezig met onderhoud. Probeer het over 30 minuten opnieuw."
                                        showHomeButton={false}
                                        showSupportLink={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Skeleton Component -->
        <section id="skeleton" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Skeleton
                    </h2>
                    <p class="text-zinc-600">
                        Flexible loading skeleton component that can adapt to
                        any content type. Use skeleton placeholders to show
                        loading states that mimic the structure of the content
                        being loaded.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">Types</h3>
                        <div class="space-y-4">
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Text (Default)
                                </p>
                                <Skeleton />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Box</p>
                                <Skeleton
                                    type="box"
                                    width="w-full"
                                    height="h-24"
                                />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Circle</p>
                                <Skeleton type="circle" width="w-16" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Text Lines
                        </h3>
                        <div class="space-y-2">
                            <Skeleton width="w-48" />
                            <Skeleton />
                            <Skeleton />
                            <Skeleton width="w-5/6" />
                            <Skeleton width="w-4/5" />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Card Skeleton
                        </h3>
                        <div
                            class="border border-zinc-200 rounded-lg p-6 space-y-4"
                        >
                            <Skeleton width="w-3/4" height="h-4" />
                            <Skeleton type="box" width="w-full" height="h-48" />
                            <div class="space-y-2">
                                <Skeleton />
                                <Skeleton />
                                <Skeleton width="w-5/6" />
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <Skeleton type="circle" width="w-10" />
                                    <Skeleton width="w-24" />
                                </div>
                                <Skeleton width="w-20" height="h-8" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            List Item Skeleton
                        </h3>
                        <div class="space-y-4">
                            {#each Array(3) as _}
                                <div class="flex items-center gap-4">
                                    <Skeleton type="circle" width="w-12" />
                                    <div class="flex-1 space-y-2">
                                        <Skeleton width="w-32" />
                                        <Skeleton width="w-24" height="h-2" />
                                    </div>
                                    <Skeleton width="w-16" height="h-4" />
                                </div>
                            {/each}
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Image with Text Layout
                        </h3>
                        <div class="flex gap-8 items-start">
                            <Skeleton type="box" width="w-48" height="h-48" />
                            <div class="flex-1 space-y-4">
                                <Skeleton width="w-3/4" height="h-6" />
                                <div class="space-y-2">
                                    <Skeleton />
                                    <Skeleton />
                                    <Skeleton width="w-5/6" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Custom Sizes
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Small text
                                </p>
                                <Skeleton width="w-24" height="h-2" />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Large box
                                </p>
                                <Skeleton
                                    type="box"
                                    width="w-96"
                                    height="h-64"
                                />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Large avatar
                                </p>
                                <Skeleton type="circle" width="w-20" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Without Animation
                        </h3>
                        <div class="space-y-2">
                            <Skeleton animated={false} width="w-48" />
                            <Skeleton animated={false} />
                            <Skeleton animated={false} width="w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- ProgressBar Component -->
        <section id="progressbar" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        ProgressBar
                    </h2>
                    <p class="text-zinc-600">
                        Progress indicator component that displays a visual
                        progress bar with optional status text and step labels.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <ProgressBar value={50} />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Status Text
                        </h3>
                        <ProgressBar
                            value={37.5}
                            statusText="Migrating MySQL database..."
                        />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Steps
                        </h3>
                        <ProgressBar
                            value={37.5}
                            statusText="Migrating MySQL database..."
                            steps={[
                                { label: "Copying files", status: "completed" },
                                {
                                    label: "Migrating database",
                                    status: "active",
                                },
                                {
                                    label: "Compiling assets",
                                    status: "pending",
                                },
                                { label: "Deployed", status: "pending" },
                            ]}
                            showSteps={true}
                        />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Variants
                        </h3>
                        <div class="space-y-4">
                            <ProgressBar
                                value={25}
                                variant="default"
                                statusText="Default variant"
                            />
                            <ProgressBar
                                value={50}
                                variant="indigo"
                                statusText="Indigo variant"
                            />
                            <ProgressBar
                                value={75}
                                variant="blue"
                                statusText="Blue variant"
                            />
                            <ProgressBar
                                value={100}
                                variant="green"
                                statusText="Green variant"
                            />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">Sizes</h3>
                        <div class="space-y-4">
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Small</p>
                                <ProgressBar value={60} size="sm" />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Medium (Default)
                                </p>
                                <ProgressBar value={60} size="md" />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Large</p>
                                <ProgressBar value={60} size="lg" />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Auto-Calculated Step Status
                        </h3>
                        <ProgressBar
                            value={progressValue}
                            statusText="Processing your request..."
                            steps={[
                                { label: "Copying files" },
                                { label: "Migrating database" },
                                { label: "Compiling assets" },
                                { label: "Deployed" },
                            ]}
                            showSteps={true}
                        />
                        <div class="flex gap-3">
                            <Button
                                size="sm"
                                onclick={() =>
                                    (progressValue = Math.max(
                                        0,
                                        progressValue - 25,
                                    ))}>-25%</Button
                            >
                            <Button
                                size="sm"
                                onclick={() =>
                                    (progressValue = Math.min(
                                        100,
                                        progressValue + 25,
                                    ))}>+25%</Button
                            >
                            <Button
                                size="sm"
                                variant="secondary"
                                onclick={() => (progressValue = 0)}
                                >Reset</Button
                            >
                            <Button
                                size="sm"
                                variant="secondary"
                                onclick={() => (progressValue = 100)}
                                >100%</Button
                            >
                        </div>
                        <p class="text-xs text-zinc-500">
                            Progress: <strong>{progressValue}%</strong>
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Different Progress States
                        </h3>
                        <div class="space-y-4">
                            <ProgressBar value={0} statusText="Starting..." />
                            <ProgressBar
                                value={25}
                                statusText="Quarter complete"
                            />
                            <ProgressBar
                                value={50}
                                statusText="Halfway there"
                            />
                            <ProgressBar value={75} statusText="Almost done" />
                            <ProgressBar
                                value={100}
                                statusText="Complete!"
                                variant="green"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Rating Component -->
        <section id="rating" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Rating
                    </h2>
                    <p class="text-zinc-600">
                        Star rating component that displays and optionally
                        allows users to set a rating value.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Display (Readonly)
                        </h3>
                        <Rating rating={4} readonly />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Interactive Rating
                        </h3>
                        <Rating
                            rating={ratingValue}
                            onchange={(r) => (ratingValue = r)}
                        />
                        <p class="text-xs text-zinc-500">
                            Current rating: <strong>{ratingValue}</strong> / 5
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Value Display
                        </h3>
                        <Rating rating={4.5} showValue readonly />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">Sizes</h3>
                        <div class="space-y-4">
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Small</p>
                                <Rating rating={3} size="sm" readonly />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Default
                                </p>
                                <Rating rating={4} readonly />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">Large</p>
                                <Rating rating={5} size="lg" readonly />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Different Ratings
                        </h3>
                        <div class="space-y-3">
                            <Rating rating={1} readonly />
                            <Rating rating={2} readonly />
                            <Rating rating={3} readonly />
                            <Rating rating={4} readonly />
                            <Rating rating={5} readonly />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Custom Max Rating
                        </h3>
                        <Rating rating={8} max={10} showValue readonly />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- StepsProgress Component -->
        <section id="steps-progress" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        StepsProgress
                    </h2>
                    <p class="text-zinc-600">
                        Progress indicator component that displays a series of
                        steps, showing completed, current, and upcoming steps.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <StepsProgress
                            steps={[
                                { label: "Step 1" },
                                { label: "Step 2" },
                                { label: "Step 3" },
                                { label: "Step 4" },
                                { label: "Step 5" },
                            ]}
                            currentStep={2}
                        />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Interactive Example
                        </h3>
                        <StepsProgress
                            steps={[
                                {
                                    label: "Sign Up",
                                    onclick: (e, i) => (currentStep = i),
                                },
                                {
                                    label: "Verify Email",
                                    onclick: (e, i) => (currentStep = i),
                                },
                                {
                                    label: "Complete Profile",
                                    onclick: (e, i) => (currentStep = i),
                                },
                                {
                                    label: "Get Started",
                                    onclick: (e, i) => (currentStep = i),
                                },
                            ]}
                            {currentStep}
                        />
                        <div class="flex gap-3 items-center">
                            <Button
                                size="sm"
                                onclick={() =>
                                    (currentStep = Math.max(
                                        0,
                                        currentStep - 1,
                                    ))}
                                disabled={currentStep === 0}>Previous</Button
                            >
                            <Button
                                size="sm"
                                onclick={() =>
                                    (currentStep = Math.min(
                                        3,
                                        currentStep + 1,
                                    ))}
                                disabled={currentStep === 3}>Next</Button
                            >
                            <p class="text-xs text-zinc-500">
                                Current step: <strong>{currentStep + 1}</strong> of
                                4
                            </p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Different States
                        </h3>
                        <div class="space-y-6">
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    First Step (Current)
                                </p>
                                <StepsProgress
                                    steps={[
                                        { label: "Step 1" },
                                        { label: "Step 2" },
                                        { label: "Step 3" },
                                        { label: "Step 4" },
                                    ]}
                                    currentStep={0}
                                />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Middle Step (Current)
                                </p>
                                <StepsProgress
                                    steps={[
                                        { label: "Step 1" },
                                        { label: "Step 2" },
                                        { label: "Step 3" },
                                        { label: "Step 4" },
                                    ]}
                                    currentStep={2}
                                />
                            </div>
                            <div>
                                <p class="text-xs text-zinc-500 mb-2">
                                    Last Step (Current - All Completed)
                                </p>
                                <StepsProgress
                                    steps={[
                                        { label: "Step 1" },
                                        { label: "Step 2" },
                                        { label: "Step 3" },
                                        { label: "Step 4" },
                                    ]}
                                    currentStep={3}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Navigation Links
                        </h3>
                        <StepsProgress
                            steps={[
                                { label: "Personal Info", href: "#personal" },
                                { label: "Account Setup", href: "#account" },
                                { label: "Preferences", href: "#preferences" },
                                { label: "Review", href: "#review" },
                            ]}
                            currentStep={1}
                        />
                        <p class="text-xs text-zinc-500 mt-2">
                            Steps with href are clickable links (hover to see
                            cursor change)
                        </p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Multi-Step Form Progress
                        </h3>
                        <StepsProgress
                            steps={[
                                { label: "Personal Information" },
                                { label: "Contact Details" },
                                { label: "Account Security" },
                                { label: "Review & Submit" },
                            ]}
                            currentStep={1}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Select Component -->
        <section id="select" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Select
                    </h2>
                    <p class="text-zinc-600">
                        Custom select dropdown component with options support.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Default
                        </h3>
                        <Select
                            bind:value={selectedValue}
                            options={selectOptions}
                            placeholder="Choose an option..."
                        />
                        {#if selectedValue}
                            <p class="text-sm text-zinc-600">
                                Selected: <strong>{selectedValue}</strong>
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Small Size
                        </h3>
                        <Select
                            options={selectOptions}
                            placeholder="Small select..."
                        />
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Disabled
                        </h3>
                        <Select
                            options={selectOptions}
                            disabled
                            placeholder="Disabled select..."
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- DatePicker Component -->
        <section id="datepicker" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        DatePicker
                    </h2>
                    <p class="text-zinc-600">
                        Date picker input component with calendar icon,
                        compatible with database DATE fields.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <div class="max-w-sm">
                            <DatePicker
                                bind:value={selectedDate}
                                placeholder="Select date"
                            />
                        </div>
                        {#if selectedDate}
                            <p class="text-sm text-zinc-600">
                                Selected: <strong>{selectedDate}</strong>
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Min/Max Dates
                        </h3>
                        <div class="max-w-sm space-y-3">
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Today onwards (min date = today)</label
                                >
                                <DatePicker
                                    bind:value={selectedDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    placeholder="Select date"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Date range example</label
                                >
                                <DatePicker
                                    bind:value={selectedDate}
                                    min={minDate}
                                    max={maxDate}
                                    placeholder="Select date"
                                />
                                <div class="mt-2 flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onclick={() => {
                                            minDate = new Date()
                                                .toISOString()
                                                .split("T")[0];
                                            const futureDate = new Date();
                                            futureDate.setDate(
                                                futureDate.getDate() + 30,
                                            );
                                            maxDate = futureDate
                                                .toISOString()
                                                .split("T")[0];
                                        }}
                                        class="text-zinc-600 hover:text-zinc-900 underline"
                                    >
                                        Set range (today to +30 days)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            States
                        </h3>
                        <div class="max-w-sm space-y-3">
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Normal</label
                                >
                                <DatePicker placeholder="Select date" />
                            </div>
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Disabled</label
                                >
                                <DatePicker
                                    disabled
                                    placeholder="Select date"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >With Value</label
                                >
                                <DatePicker
                                    value="2025-10-30"
                                    placeholder="Select date"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Size Variants
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Small (default) - Most compact</label
                                >
                                <div class="max-w-sm">
                                    <DatePicker
                                        placeholder="Select date"
                                        size="sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Medium</label
                                >
                                <div class="max-w-sm">
                                    <DatePicker
                                        placeholder="Select date"
                                        size="md"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-zinc-500 mb-1"
                                    >Large - Most spacious</label
                                >
                                <div class="max-w-sm">
                                    <DatePicker
                                        placeholder="Select date"
                                        size="lg"
                                    />
                                </div>
                            </div>
                            <p class="text-xs text-zinc-500">
                                Note: The input field size stays the same. Only
                                the calendar dropdown compactness changes.
                            </p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Form Integration
                        </h3>
                        <div class="max-w-sm">
                            <form
                                onsubmit={(e) => {
                                    e.preventDefault();
                                    console.log(
                                        "Form submitted with date:",
                                        selectedDate,
                                    );
                                }}
                                class="space-y-3"
                            >
                                <div>
                                    <label
                                        for="start-date"
                                        class="block text-xs text-zinc-500 mb-1"
                                    >
                                        Start Date
                                    </label>
                                    <DatePicker
                                        id="start-date"
                                        name="start_date"
                                        bind:value={selectedDate}
                                        required
                                    />
                                </div>
                                <button type="submit" class="btn btn-sm"
                                    >Submit Form</button
                                >
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- DropdownNav Component -->
        <section id="dropdownnav" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        DropdownNav
                    </h2>
                    <p class="text-zinc-600">
                        Dropdown navigation menu component for displaying a list
                        of menu items with smooth transitions.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Default (Left Position)
                        </h3>
                        <div class="flex items-center gap-4">
                            <DropdownNav
                                label="Solutions"
                                items={dropdownItems}
                            />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Right Position
                        </h3>
                        <div class="flex items-center gap-4">
                            <DropdownNav
                                label="Menu"
                                items={dropdownItems}
                                position="right"
                            />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Center Position
                        </h3>
                        <div class="flex items-center gap-4">
                            <DropdownNav
                                label="Actions"
                                items={dropdownItems}
                                position="center"
                            />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Disabled Item
                        </h3>
                        <div class="flex items-center gap-4">
                            <DropdownNav
                                label="Settings"
                                items={[
                                    { label: "Profile", href: "/profile" },
                                    { label: "Account", href: "/account" },
                                    {
                                        label: "Billing",
                                        href: "/billing",
                                        disabled: true,
                                    },
                                    { label: "Support", href: "/support" },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Toast Component -->
        <section id="toast" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Toast
                    </h2>
                    <p class="text-zinc-600">
                        Toast notification component for displaying temporary
                        messages. Includes ToastContainer for managing multiple
                        toasts.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <div class="flex flex-wrap gap-3">
                        <Button onclick={() => showToast("success")}
                            >Show Success Toast</Button
                        >
                        <Button onclick={() => showToast("error")}
                            >Show Error Toast</Button
                        >
                        <Button onclick={() => showToast("warning")}
                            >Show Warning Toast</Button
                        >
                        <Button onclick={() => showToast("info")}
                            >Show Info Toast</Button
                        >
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Accordion Component -->
        <section id="accordion" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Accordion
                    </h2>
                    <p class="text-zinc-600">
                        Collapsible accordion component for organizing content
                        into expandable sections.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <Accordion items={accordionItems} />
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Tabs Component -->
        <section id="tabs" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Tabs
                    </h2>
                    <p class="text-zinc-600">
                        Tab navigation component for organizing content into
                        separate views.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <Tabs tabs={tabItems} defaultTab="tab1">
                        {#snippet children({ activeTab })}
                            {#if activeTab === "tab1"}
                                <div class="p-4 bg-zinc-50 rounded-md">
                                    <h3 class="font-medium text-zinc-900 mb-2">
                                        Overview Content
                                    </h3>
                                    <p class="text-sm text-zinc-600">
                                        This is the overview tab content. It
                                        provides general information about the
                                        component library.
                                    </p>
                                </div>
                            {:else if activeTab === "tab2"}
                                <div class="p-4 bg-zinc-50 rounded-md">
                                    <h3 class="font-medium text-zinc-900 mb-2">
                                        Features Content
                                    </h3>
                                    <p class="text-sm text-zinc-600">
                                        This tab showcases the key features of
                                        the component library, including
                                        accessibility, customization, and design
                                        system adherence.
                                    </p>
                                </div>
                            {:else if activeTab === "tab3"}
                                <div class="p-4 bg-zinc-50 rounded-md">
                                    <h3 class="font-medium text-zinc-900 mb-2">
                                        Usage Content
                                    </h3>
                                    <p class="text-sm text-zinc-600">
                                        This tab explains how to import and use
                                        components in your application,
                                        including code examples and prop
                                        documentation.
                                    </p>
                                </div>
                            {/if}
                        {/snippet}
                    </Tabs>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Drawer Component -->
        <section id="drawer" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Drawer
                    </h2>
                    <p class="text-zinc-600">
                        Slide-out drawer component that can be positioned from
                        any side of the screen.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <div class="flex flex-wrap gap-3">
                        <Button onclick={() => openDrawer("left")}
                            >Open Left Drawer</Button
                        >
                        <Button onclick={() => openDrawer("right")}
                            >Open Right Drawer</Button
                        >
                        <Button onclick={() => openDrawer("top")}
                            >Open Top Drawer</Button
                        >
                        <Button onclick={() => openDrawer("bottom")}
                            >Open Bottom Drawer</Button
                        >
                    </div>
                    <Drawer bind:open={drawerOpen} position={drawerPosition}>
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-zinc-900">
                                Drawer from {drawerPosition
                                    .charAt(0)
                                    .toUpperCase() + drawerPosition.slice(1)}
                            </h3>
                            <p class="text-zinc-600">
                                This is a drawer component that slides in from
                                the {drawerPosition} side. You can place any content
                                inside the drawer slot.
                            </p>
                            <div class="pt-4 border-t border-zinc-200">
                                <Button onclick={() => (drawerOpen = false)}
                                    >Close Drawer</Button
                                >
                            </div>
                        </div>
                    </Drawer>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Modal Component -->
        <section id="modal" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Modal
                    </h2>
                    <p class="text-zinc-600">
                        Modal dialog component for displaying focused content
                        with overlay backdrop.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <div class="flex flex-wrap gap-3">
                        <Button onclick={() => openModal("sm")}
                            >Open Small Modal</Button
                        >
                        <Button onclick={() => openModal("md")}
                            >Open Medium Modal</Button
                        >
                        <Button onclick={() => openModal("lg")}
                            >Open Large Modal</Button
                        >
                    </div>
                    <Modal
                        bind:open={modalOpen}
                        title="Modal Dialog"
                        size={modalSize}
                    >
                        <div class="space-y-4">
                            <p class="text-zinc-600">
                                This is a modal dialog component with size: <strong
                                    >{modalSize}</strong
                                >. Modals are useful for focused user
                                interactions, confirmations, and displaying
                                detailed information.
                            </p>
                            <div
                                class="pt-4 border-t border-zinc-200 flex gap-3"
                            >
                                <Button onclick={() => (modalOpen = false)}
                                    >Close</Button
                                >
                                <Button
                                    variant="secondary"
                                    onclick={() => (modalOpen = false)}
                                    >Cancel</Button
                                >
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- SpeedDial Component -->
        <section id="speed-dial" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        SpeedDial
                    </h2>
                    <p class="text-zinc-600">
                        A floating action button that displays a list of action
                        buttons when triggered. Perfect for quick access to
                        common actions.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage (Click Trigger)
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Default speed dial positioned in bottom-right with
                            click trigger:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        onclick: () =>
                                            toastStore.add(
                                                "Share clicked",
                                                "info",
                                            ),
                                    },
                                    {
                                        icon: Printer,
                                        label: "Printer",
                                        onclick: () =>
                                            toastStore.add(
                                                "Printer clicked",
                                                "info",
                                            ),
                                    },
                                    {
                                        icon: Download,
                                        label: "Download",
                                        onclick: () =>
                                            toastStore.add(
                                                "Download clicked",
                                                "info",
                                            ),
                                    },
                                    {
                                        icon: Copy,
                                        label: "Copy",
                                        onclick: () =>
                                            toastStore.add(
                                                "Copy clicked",
                                                "info",
                                            ),
                                    },
                                ]}
                                positioning="absolute"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Hover Trigger
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Speed dial that opens on hover instead of click:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        onclick: () =>
                                            toastStore.add(
                                                "Share clicked",
                                                "info",
                                            ),
                                    },
                                    {
                                        icon: Mail,
                                        label: "Email",
                                        onclick: () =>
                                            toastStore.add(
                                                "Email clicked",
                                                "info",
                                            ),
                                    },
                                    {
                                        icon: Save,
                                        label: "Save",
                                        onclick: () =>
                                            toastStore.add(
                                                "Save clicked",
                                                "info",
                                            ),
                                    },
                                ]}
                                trigger="hover"
                                position="top-left"
                                positioning="absolute"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Different Positions
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Speed dials can be positioned in any corner:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Printer,
                                        label: "Printer",
                                        onclick: () => {},
                                    },
                                ]}
                                position="top-right"
                                size="sm"
                                positioning="absolute"
                            />
                            <SpeedDial
                                items={[
                                    {
                                        icon: Download,
                                        label: "Download",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Copy,
                                        label: "Copy",
                                        onclick: () => {},
                                    },
                                ]}
                                position="bottom-left"
                                size="sm"
                                positioning="absolute"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Horizontal Alignment
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Menu items can be aligned horizontally:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Printer,
                                        label: "Printer",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Download,
                                        label: "Download",
                                        onclick: () => {},
                                    },
                                ]}
                                alignment="horizontal"
                                position="top-right"
                                positioning="absolute"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Item Variants
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Menu items can have different color variants:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        variant: "primary",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Save,
                                        label: "Save",
                                        variant: "success",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Trash2,
                                        label: "Delete",
                                        variant: "danger",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Copy,
                                        label: "Copy",
                                        variant: "default",
                                        onclick: () => {},
                                    },
                                ]}
                                position="bottom-right"
                                positioning="absolute"
                                class="!bottom-6 !right-6"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Different Sizes
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Trigger button can be small, default, or large:
                        </p>
                        <div
                            class="relative h-64 border border-zinc-200 rounded-md bg-zinc-50"
                        >
                            <SpeedDial
                                items={[
                                    {
                                        icon: Share,
                                        label: "Share",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Printer,
                                        label: "Printer",
                                        onclick: () => {},
                                    },
                                ]}
                                size="sm"
                                position="bottom-right"
                                positioning="absolute"
                                class="!bottom-6 !right-6"
                            />
                            <SpeedDial
                                items={[
                                    {
                                        icon: Download,
                                        label: "Download",
                                        onclick: () => {},
                                    },
                                    {
                                        icon: Copy,
                                        label: "Copy",
                                        onclick: () => {},
                                    },
                                ]}
                                size="lg"
                                position="bottom-right"
                                positioning="absolute"
                                class="!bottom-[4.5rem] !right-6"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Toggle Component -->
        <section id="toggle" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Toggle
                    </h2>
                    <p class="text-zinc-600">
                        A toggle switch component with smooth transitions,
                        perfect for boolean settings and feature toggles.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <div class="flex items-center gap-4">
                            <Toggle />
                            <Toggle checked={true} />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Controlled Toggle
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Toggle with state management:
                        </p>
                        <div class="flex items-center gap-4">
                            <Toggle
                                checked={toggleEnabled}
                                onchange={(e) =>
                                    (toggleEnabled = e.currentTarget.checked)}
                            />
                            <span class="text-sm text-zinc-600"
                                >Status: {toggleEnabled
                                    ? "Enabled"
                                    : "Disabled"}</span
                            >
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Label
                        </h3>
                        <div class="flex items-center gap-4">
                            <label class="text-sm text-zinc-700 font-medium"
                                >Enable Notifications</label
                            >
                            <Toggle
                                checked={toggleNotifications}
                                onchange={(e) =>
                                    (toggleNotifications =
                                        e.currentTarget.checked)}
                                ariaLabel="Enable notifications"
                            />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Disabled State
                        </h3>
                        <div class="flex items-center gap-4">
                            <Toggle disabled />
                            <Toggle checked disabled />
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Name Attribute
                        </h3>
                        <p class="text-sm text-zinc-600">
                            Useful for form submission:
                        </p>
                        <div class="flex items-center gap-4">
                            <Toggle
                                name="dark-mode"
                                ariaLabel="Enable dark mode"
                            />
                            <Toggle
                                name="email-notifications"
                                checked
                                ariaLabel="Enable email notifications"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- RadioGroup Component -->
        <section id="radio-group" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        RadioGroup
                    </h2>
                    <p class="text-zinc-600">
                        A form component for displaying a group of radio button
                        options within a fieldset with legend and optional
                        description.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <RadioGroup
                            name="notification-method"
                            legend="Notifications"
                            description="How do you prefer to receive notifications?"
                            options={[
                                { id: "email", label: "Email", value: "email" },
                                {
                                    id: "sms",
                                    label: "Phone (SMS)",
                                    value: "sms",
                                },
                                {
                                    id: "push",
                                    label: "Push notification",
                                    value: "push",
                                },
                            ]}
                            value={notificationMethod}
                            onchange={(e) =>
                                (notificationMethod = e.currentTarget.value)}
                        />
                        <p class="text-xs text-zinc-500">
                            Selected: <strong>{notificationMethod}</strong>
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Horizontal Layout
                        </h3>
                        <RadioGroup
                            name="preference-horizontal"
                            legend="Preferences"
                            options={[
                                {
                                    id: "opt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "opt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "opt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            layout="horizontal"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Vertical Layout
                        </h3>
                        <RadioGroup
                            name="preference-vertical"
                            legend="Preferences"
                            options={[
                                {
                                    id: "vopt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "vopt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "vopt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            layout="vertical"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Controlled Component
                        </h3>
                        <p class="text-sm text-zinc-600">
                            RadioGroup with state management:
                        </p>
                        <RadioGroup
                            name="preference-controlled"
                            legend="Controlled Radio Group"
                            options={[
                                {
                                    id: "copt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "copt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "copt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            value={preferenceOption}
                            onchange={(e) =>
                                (preferenceOption = e.currentTarget.value)}
                        />
                        <p class="text-xs text-zinc-500">
                            Selected: <strong>{preferenceOption}</strong>
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Disabled Options
                        </h3>
                        <RadioGroup
                            name="status"
                            legend="Status"
                            options={[
                                {
                                    id: "active",
                                    label: "Active",
                                    value: "active",
                                },
                                {
                                    id: "pending",
                                    label: "Pending",
                                    value: "pending",
                                    disabled: true,
                                },
                                {
                                    id: "inactive",
                                    label: "Inactive",
                                    value: "inactive",
                                },
                            ]}
                            value={statusValue}
                            onchange={(e) =>
                                (statusValue = e.currentTarget.value)}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Disabled Radio Group
                        </h3>
                        <RadioGroup
                            name="disabled-group"
                            legend="Disabled Group"
                            description="This entire group is disabled"
                            options={[
                                {
                                    id: "dopt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "dopt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                            ]}
                            disabled={true}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Without Legend or Description
                        </h3>
                        <RadioGroup
                            name="simple"
                            options={[
                                {
                                    id: "sopt1",
                                    label: "Simple Option 1",
                                    value: "opt1",
                                },
                                {
                                    id: "sopt2",
                                    label: "Simple Option 2",
                                    value: "opt2",
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- CheckboxGroup Component -->
        <section id="checkbox-group" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        CheckboxGroup
                    </h2>
                    <p class="text-zinc-600">
                        A form component for displaying a group of checkbox
                        options within a fieldset with legend and optional
                        description. Supports multiple selections.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage
                        </h3>
                        <CheckboxGroup
                            name="notification-methods"
                            legend="Notifications"
                            description="How do you prefer to receive notifications? (Select all that apply)"
                            options={[
                                { id: "email", label: "Email", value: "email" },
                                {
                                    id: "sms",
                                    label: "Phone (SMS)",
                                    value: "sms",
                                },
                                {
                                    id: "push",
                                    label: "Push notification",
                                    value: "push",
                                },
                            ]}
                            value={selectedNotifications}
                            onchange={(e) => {
                                const checked = e.currentTarget.checked;
                                const value = e.currentTarget.value;
                                if (checked) {
                                    selectedNotifications = [
                                        ...selectedNotifications,
                                        value,
                                    ];
                                } else {
                                    selectedNotifications =
                                        selectedNotifications.filter(
                                            (v) => v !== value,
                                        );
                                }
                            }}
                        />
                        <p class="text-xs text-zinc-500">
                            Selected: <strong
                                >{selectedNotifications.join(", ") ||
                                    "none"}</strong
                            >
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Horizontal Layout
                        </h3>
                        <CheckboxGroup
                            name="preferences-horizontal"
                            legend="Preferences"
                            options={[
                                {
                                    id: "opt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "opt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "opt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            layout="horizontal"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Vertical Layout
                        </h3>
                        <CheckboxGroup
                            name="preferences-vertical"
                            legend="Preferences"
                            options={[
                                {
                                    id: "vopt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "vopt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "vopt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            layout="vertical"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Controlled Component
                        </h3>
                        <p class="text-sm text-zinc-600">
                            CheckboxGroup with state management:
                        </p>
                        <CheckboxGroup
                            name="preference-controlled"
                            legend="Controlled Checkbox Group"
                            options={[
                                {
                                    id: "copt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "copt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                                {
                                    id: "copt3",
                                    label: "Option 3",
                                    value: "option3",
                                },
                            ]}
                            value={selectedPreferences}
                            onchange={(e) => {
                                const checked = e.currentTarget.checked;
                                const value = e.currentTarget.value;
                                if (checked) {
                                    selectedPreferences = [
                                        ...selectedPreferences,
                                        value,
                                    ];
                                } else {
                                    selectedPreferences =
                                        selectedPreferences.filter(
                                            (v) => v !== value,
                                        );
                                }
                            }}
                        />
                        <p class="text-xs text-zinc-500">
                            Selected: <strong
                                >{selectedPreferences.join(", ") ||
                                    "none"}</strong
                            >
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Disabled Options
                        </h3>
                        <CheckboxGroup
                            name="status"
                            legend="Status"
                            options={[
                                {
                                    id: "active",
                                    label: "Active",
                                    value: "active",
                                },
                                {
                                    id: "pending",
                                    label: "Pending",
                                    value: "pending",
                                    disabled: true,
                                },
                                {
                                    id: "inactive",
                                    label: "Inactive",
                                    value: "inactive",
                                },
                            ]}
                            value={selectedStatuses}
                            onchange={(e) => {
                                const checked = e.currentTarget.checked;
                                const value = e.currentTarget.value;
                                if (checked) {
                                    selectedStatuses = [
                                        ...selectedStatuses,
                                        value,
                                    ];
                                } else {
                                    selectedStatuses = selectedStatuses.filter(
                                        (v) => v !== value,
                                    );
                                }
                            }}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Disabled Checkbox Group
                        </h3>
                        <CheckboxGroup
                            name="disabled-group"
                            legend="Disabled Group"
                            description="This entire group is disabled"
                            options={[
                                {
                                    id: "dopt1",
                                    label: "Option 1",
                                    value: "option1",
                                },
                                {
                                    id: "dopt2",
                                    label: "Option 2",
                                    value: "option2",
                                },
                            ]}
                            disabled={true}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Without Legend or Description
                        </h3>
                        <CheckboxGroup
                            name="simple"
                            options={[
                                {
                                    id: "sopt1",
                                    label: "Simple Option 1",
                                    value: "opt1",
                                },
                                {
                                    id: "sopt2",
                                    label: "Simple Option 2",
                                    value: "opt2",
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- FileUpload Component -->
        <section id="file-upload" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        FileUpload
                    </h2>
                    <p class="text-zinc-600">
                        A flexible file upload component that supports both
                        simple button-style uploads and drag-and-drop
                        functionality with file validation.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Drag-Drop
                        </h3>
                        <FileUpload
                            label="Upload Document"
                            description="PNG, JPG, GIF up to 10MB"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Simple Button Style
                        </h3>
                        <FileUpload
                            variant="simple"
                            placeholder="Choose File"
                            label="Profile Photo"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With File Type Restrictions
                        </h3>
                        <FileUpload
                            accept="image/*"
                            acceptedFileTypes={[
                                "image/png",
                                "image/jpeg",
                                ".jpg",
                                ".png",
                            ]}
                            description="PNG or JPG images only"
                            label="Upload Image"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With File Size Limit
                        </h3>
                        <FileUpload
                            maxSize={5 * 1024 * 1024}
                            description="Files up to 5MB"
                            label="Upload Document"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Multiple Files
                        </h3>
                        <FileUpload
                            multiple
                            label="Upload Multiple Files"
                            placeholder="Choose Files"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Document Upload with Validation
                        </h3>
                        <FileUpload
                            accept=".pdf,.doc,.docx"
                            acceptedFileTypes={[
                                ".pdf",
                                ".doc",
                                ".docx",
                                "application/pdf",
                            ]}
                            maxSize={10 * 1024 * 1024}
                            label="Upload Document"
                            description="PDF or Word documents, max 10MB"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Disabled State
                        </h3>
                        <FileUpload
                            disabled
                            label="Upload (Disabled)"
                            description="Upload is currently disabled"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- FileList Component -->
        <section id="file-list" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        FileList
                    </h2>
                    <p class="text-zinc-600">
                        A table-based component for displaying a list of files
                        with name, type, and action buttons.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage (URLs only)
                        </h3>
                        <FileList
                            files={[
                                "https://example.com/document.pdf",
                                "https://example.com/image.jpg",
                                "https://example.com/spreadsheet.xlsx",
                            ]}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Title
                        </h3>
                        <FileList
                            files={[
                                "https://example.com/file1.pdf",
                                "https://example.com/file2.docx",
                            ]}
                            title="Bijlagen:"
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Delete Action
                        </h3>
                        <FileList
                            files={[
                                "https://example.com/temp1.pdf",
                                "https://example.com/temp2.jpg",
                            ]}
                            showDelete={true}
                            ondelete={(url) =>
                                toastStore.add(`Delete: ${url}`, "info")}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With File Objects
                        </h3>
                        <FileList
                            files={[
                                {
                                    url: "https://example.com/document.pdf",
                                    name: "My Document",
                                    size: 1024000,
                                    type: "PDF",
                                },
                                {
                                    url: "https://example.com/photo.jpg",
                                    name: "Photo",
                                    size: 512000,
                                    type: "JPG",
                                },
                            ]}
                            title="Attachments"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- SearchFilterPanel Component -->
        <section id="search-filter-panel" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        SearchFilterPanel
                    </h2>
                    <p class="text-zinc-600">
                        A reusable search and filter panel component with a
                        toggle button (Search/X icon) to show/hide filter
                        content. Perfect for implementing collapsible search and
                        filter interfaces.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Usage (Both Button and Panel)
                        </h3>
                        <p class="text-xs text-zinc-500">
                            Default mode renders both button and panel together.
                        </p>
                        <SearchFilterPanel bind:open={searchPanelOpen}>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Search</label
                                    >
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Filter</label
                                    >
                                    <select
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    >
                                        <option>All Items</option>
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Status</label
                                    >
                                    <select
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    >
                                        <option>All Statuses</option>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </SearchFilterPanel>
                        <p class="text-xs text-zinc-500">
                            Panel is {searchPanelOpen ? "open" : "closed"}
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Full-Width Panel (Separate Button and Panel)
                        </h3>
                        <p class="text-xs text-zinc-500">
                            Use mode="button" and mode="panel" to render
                            separately. Useful when button is in a flex
                            container but panel needs to span full width.
                        </p>
                        <div class="flex justify-between items-center mb-4">
                            <SearchFilterPanel
                                bind:open={searchPanelOpen2}
                                mode="button"
                            />
                            <Button>Action Button</Button>
                        </div>
                        <SearchFilterPanel
                            bind:open={searchPanelOpen2}
                            mode="panel"
                        >
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Search</label
                                    >
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Category</label
                                    >
                                    <select
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    >
                                        <option>All Categories</option>
                                        <option>Category 1</option>
                                        <option>Category 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Status</label
                                    >
                                    <select
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    >
                                        <option>All Statuses</option>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-zinc-900 mb-2"
                                        >Owner</label
                                    >
                                    <select
                                        class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                    >
                                        <option>All Owners</option>
                                        <option>User 1</option>
                                        <option>User 2</option>
                                    </select>
                                </div>
                            </div>
                        </SearchFilterPanel>
                        <p class="text-xs text-zinc-500">
                            Panel is {searchPanelOpen2 ? "open" : "closed"}
                        </p>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Custom Tooltips
                        </h3>
                        <SearchFilterPanel
                            bind:open={searchPanelOpen}
                            searchTooltip="Open search filters"
                            closeTooltip="Close search filters"
                        >
                            <div class="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    class="w-full px-3 py-2 border border-zinc-200 rounded-sm"
                                />
                                <div class="flex gap-2">
                                    <Button size="sm">Apply Filters</Button>
                                    <Button size="sm" variant="secondary"
                                        >Reset</Button
                                    >
                                </div>
                            </div>
                        </SearchFilterPanel>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Mermaid Component -->
        <section id="mermaid" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Mermaid
                    </h2>
                    <p class="text-zinc-600">
                        Renders Mermaid diagrams from Mermaid syntax. Supports
                        flowcharts, sequence diagrams, Gantt charts, and more
                        diagram types.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Flowchart
                        </h3>
                        <Mermaid
                            code={`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Sequence Diagram
                        </h3>
                        <Mermaid
                            code={`sequenceDiagram
    participant A as Client
    participant B as Server

    A->>B: Request
    B-->>A: Response
    B->>B: Process Request`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            State Diagram
                        </h3>
                        <Mermaid
                            code={`stateDiagram-v2
    [*] --> Idle
    Idle --> Active: Start
    Active --> Idle: Stop
    Active --> Paused: Pause
    Paused --> Active: Resume
    Paused --> Idle: Stop`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Class Diagram
                        </h3>
                        <Mermaid
                            code={`classDiagram
    class Animal {
        +String name
        +int age
        +eat()
        +sleep()
    }

    class Dog {
        +String breed
        +bark()
    }

    class Cat {
        +String color
        +meow()
    }

    Animal <|-- Dog
    Animal <|-- Cat`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Pie Chart
                        </h3>
                        <Mermaid
                            code={`pie title Sales Distribution
    "Desktop" : 45.2
    "Mobile" : 32.1
    "Tablet" : 15.3
    "Other" : 7.4`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            With Dark Theme
                        </h3>
                        <Mermaid
                            code={`graph LR
    A[Node A] --> B[Node B]
    B --> C[Node C]
    C --> A`}
                            config={{ theme: "dark" }}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Nomnoml Component -->
        <section id="nomnoml" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Nomnoml
                    </h2>
                    <p class="text-zinc-600">
                        Renders UML diagrams from Nomnoml syntax. Supports class
                        diagrams, component diagrams, flow charts, use case
                        diagrams, and more.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Basic Class Diagram
                        </h3>
                        <Nomnoml code={`[Car]->[Engine]`} />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Class with Attributes
                        </h3>
                        <Nomnoml code={`[Car|speed: Number;valves: Valve[]]`} />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Class with Operations
                        </h3>
                        <Nomnoml code={`[Engine||start()]`} />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Association Types
                        </h3>
                        <Nomnoml
                            code={`[Car]->[Engine]
[Car]o->[Manufacturer]
[Car]<:-[Pickup]`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Flow Chart
                        </h3>
                        <Nomnoml
                            code={`[<start>start] -> [<state>plunder] -> [<choice>more loot] -> [start]`}
                        />
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-zinc-700">
                            Complex Class Diagram
                        </h3>
                        <Nomnoml
                            code={`[Car|speed: Number;valves: Valve[]]
[Car]+->0..*[RustPatch]
[Car]o->[Manufacturer]
[Car]<:-[Pickup]

[Engine||start()]
[Engine|
  [Cylinder]->1[Piston]
  [Cylinder]->2[Valve]
]`}
                        />
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- SvelteFlow Component -->
        <section id="svelteflow" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        SvelteFlow
                    </h2>
                    <p class="text-zinc-600">
                        Interactive node-based flow diagram component. Supports
                        custom nodes, edges, and interactive editing of flow
                        diagrams.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <Tabs tabs={svelteFlowTabs} defaultTab="overview">
                        {#snippet children({ activeTab })}
                            {#if activeTab === "overview"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Comprehensive overview demonstrating
                                        various node types, edge types, and
                                        Svelte Flow capabilities.
                                    </p>
                                    <SvelteFlow
                                        bind:nodes={overviewNodes}
                                        bind:edges={overviewEdges}
                                        height="400px"
                                        autoLayout={true}
                                        fitView={true}
                                        fitViewOptions={{ padding: 30 }}
                                        background={{
                                            variant: "dots",
                                            gap: 16,
                                        }}
                                        controls={true}
                                        defaultEdgeOptions={{
                                            type: "smoothstep",
                                            animated: false,
                                        }}
                                        layoutOptions={{
                                            direction: "TB",
                                            nodeSpacing: 100,
                                            layerSpacing: 150,
                                        }}
                                    />
                                </div>
                            {:else if activeTab === "context-menu"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Right-click on nodes to see the context
                                        menu. Click elsewhere to close it.
                                    </p>
                                    <div
                                        class="relative"
                                        style="height: 400px;"
                                    >
                                        <SvelteFlow
                                            bind:nodes={contextMenuNodes}
                                            bind:edges={contextMenuEdges}
                                            nodeTypes={svelteFlowNodeTypes}
                                            height="400px"
                                            autoLayout={true}
                                            fitView={true}
                                            fitViewOptions={{ padding: 40 }}
                                            background={{
                                                variant: "dots",
                                                gap: 16,
                                            }}
                                            controls={true}
                                            minimap={{
                                                height: 120,
                                                zoomable: true,
                                                pannable: true,
                                            }}
                                            defaultEdgeOptions={{
                                                type: "smoothstep",
                                                animated: false,
                                            }}
                                            layoutOptions={{
                                                direction: "TB",
                                                nodeSpacing: 120,
                                                layerSpacing: 180,
                                            }}
                                            onNodeContextMenu={handleNodeContextMenu}
                                            onPaneClick={closeContextMenu}
                                            onNodeClick={(event, node) => {
                                                console.log(
                                                    "Node clicked:",
                                                    node,
                                                );
                                            }}
                                        />
                                        {#if contextMenuState}
                                            <div
                                                class="absolute bg-white border border-zinc-200 rounded-lg shadow-lg p-2 z-50 min-w-[120px]"
                                                style="top: {contextMenuState.top ??
                                                    'auto'}px; left: {contextMenuState.left ??
                                                    'auto'}px; right: {contextMenuState.right !==
                                                undefined
                                                    ? contextMenuState.right +
                                                      'px'
                                                    : 'auto'}; bottom: {contextMenuState.bottom !==
                                                undefined
                                                    ? contextMenuState.bottom +
                                                      'px'
                                                    : 'auto'}"
                                                onclick={(e) =>
                                                    e.stopPropagation()}
                                            >
                                                <div
                                                    class="text-xs text-zinc-700 px-3 py-2 hover:bg-zinc-100 rounded cursor-pointer"
                                                    onclick={() => {
                                                        toastStore.add(
                                                            `Node ${contextMenuState!.id} - Action 1`,
                                                            "info",
                                                        );
                                                        closeContextMenu();
                                                    }}
                                                >
                                                    Action 1
                                                </div>
                                                <div
                                                    class="text-xs text-zinc-700 px-3 py-2 hover:bg-zinc-100 rounded cursor-pointer"
                                                    onclick={() => {
                                                        toastStore.add(
                                                            `Node ${contextMenuState!.id} - Action 2`,
                                                            "info",
                                                        );
                                                        closeContextMenu();
                                                    }}
                                                >
                                                    Action 2
                                                </div>
                                                <div
                                                    class="text-xs text-red-600 px-3 py-2 hover:bg-red-50 rounded cursor-pointer"
                                                    onclick={() => {
                                                        toastStore.add(
                                                            `Node ${contextMenuState!.id} deleted`,
                                                            "warning",
                                                        );
                                                        closeContextMenu();
                                                    }}
                                                >
                                                    Delete
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {:else if activeTab === "dagre"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Dagre layout algorithm automatically
                                        arranges nodes in a hierarchical
                                        structure.
                                    </p>
                                    <SvelteFlow
                                        bind:nodes={dagreNodes}
                                        bind:edges={dagreEdges}
                                        nodeTypes={svelteFlowNodeTypes}
                                        height="400px"
                                        autoLayout={true}
                                        fitView={true}
                                        fitViewOptions={{ padding: 40 }}
                                        background={{
                                            variant: "dots",
                                            gap: 20,
                                        }}
                                        controls={true}
                                        minimap={{
                                            height: 120,
                                            zoomable: true,
                                            pannable: true,
                                            nodeClass: (node) =>
                                                node.type || "default",
                                        }}
                                        defaultEdgeOptions={{
                                            type: "smoothstep",
                                            animated: false,
                                        }}
                                        layoutOptions={{
                                            direction: "TB",
                                            nodeSpacing: 100,
                                            layerSpacing: 150,
                                            nodeWidth: 200,
                                            nodeHeight: 120,
                                        }}
                                        onSelectionChange={(params) => {
                                            if (params.nodes.length > 0) {
                                                console.log(
                                                    "Selected nodes:",
                                                    params.nodes.map(
                                                        (n) =>
                                                            n.data?.title ||
                                                            n.id,
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                </div>
                            {:else if activeTab === "horizontal"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Horizontal flow layout with nodes
                                        arranged left-to-right.
                                    </p>
                                    <SvelteFlow
                                        bind:nodes={horizontalNodes}
                                        bind:edges={horizontalEdges}
                                        nodeTypes={svelteFlowNodeTypes}
                                        height="300px"
                                        autoLayout={true}
                                        fitView={true}
                                        fitViewOptions={{ padding: 40 }}
                                        background={{
                                            variant: "dots",
                                            gap: 16,
                                        }}
                                        controls={true}
                                        defaultEdgeOptions={{
                                            type: "smoothstep",
                                            animated: true,
                                        }}
                                        layoutOptions={{
                                            direction: "LR",
                                            nodeSpacing: 150,
                                            layerSpacing: 200,
                                            nodeWidth: 180,
                                            nodeHeight: 100,
                                        }}
                                        onConnect={(connection) => {
                                            console.log(
                                                "New connection:",
                                                connection,
                                            );
                                        }}
                                    />
                                </div>
                            {:else if activeTab === "tailwind"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Card nodes with different variants
                                        (info, success, warning) demonstrating
                                        visual differentiation. Edges are
                                        color-coded to match their source node
                                        variant.
                                    </p>
                                    <SvelteFlow
                                        bind:nodes={tailwindNodes}
                                        bind:edges={tailwindEdges}
                                        nodeTypes={svelteFlowNodeTypes}
                                        height="300px"
                                        autoLayout={true}
                                        fitView={true}
                                        fitViewOptions={{ padding: 40 }}
                                        background={{
                                            variant: "dots",
                                            gap: 16,
                                        }}
                                        controls={true}
                                        defaultEdgeOptions={{
                                            type: "smoothstep",
                                            animated: false,
                                        }}
                                        layoutOptions={{
                                            direction: "LR",
                                            nodeSpacing: 150,
                                            layerSpacing: 200,
                                        }}
                                    />
                                </div>
                            {:else if activeTab === "threlte"}
                                <div class="space-y-3">
                                    <p class="text-sm text-zinc-600 mb-4">
                                        Demonstrating different edge types:
                                        smoothstep (curved), step (stepped), and
                                        bezier (curved). Each edge type provides
                                        a different visual style for
                                        connections.
                                    </p>
                                    <SvelteFlow
                                        bind:nodes={threlteNodes}
                                        bind:edges={threlteEdges}
                                        nodeTypes={svelteFlowNodeTypes}
                                        height="300px"
                                        autoLayout={true}
                                        fitView={true}
                                        fitViewOptions={{ padding: 40 }}
                                        background={{
                                            variant: "dots",
                                            gap: 16,
                                        }}
                                        controls={true}
                                        minimap={{
                                            height: 100,
                                            zoomable: true,
                                        }}
                                        defaultEdgeOptions={{
                                            type: "smoothstep",
                                            animated: false,
                                        }}
                                        layoutOptions={{
                                            direction: "LR",
                                            nodeSpacing: 180,
                                            layerSpacing: 200,
                                        }}
                                        onEdgeClick={(event, edge) => {
                                            console.log(
                                                "Edge type:",
                                                edge.type,
                                            );
                                        }}
                                    />
                                </div>
                            {/if}
                        {/snippet}
                    </Tabs>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- HeatmapTable Component -->
        <section id="heatmap-table" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        HeatmapTable
                    </h2>
                    <p class="text-zinc-600">
                        A reusable heatmap table component that displays data in
                        a color-coded grid format, perfect for visualizing
                        time-series data like hours per week or activity levels.
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-6"
                >
                    {#if true}
                        {@const exampleRowLabels = [
                            "Week 1",
                            "Week 2",
                            "Week 3",
                            "Week 4",
                            "Week 5",
                        ]}
                        {@const exampleData = new Map([
                            ["2025-01-1", 8],
                            ["2025-01-2", 12],
                            ["2025-01-3", 5],
                            ["2025-01-4", 15],
                            ["2025-02-1", 20],
                            ["2025-02-2", 10],
                            ["2025-02-3", 18],
                            ["2025-03-1", 25],
                            ["2025-03-2", 8],
                        ])}
                        {@const exampleColumnLabels = [
                            "Jan 2025",
                            "Feb 2025",
                            "Mrt 2025",
                        ]}
                        {@const formattedData = new Map([
                            ["2025-01-1", 8.5],
                            ["2025-01-2", 12.25],
                            ["2025-02-1", 20.75],
                        ])}
                        {@const formatHours = (v: number) => `${v.toFixed(1)}h`}
                        <div class="space-y-3">
                            <h3 class="text-sm font-medium text-zinc-700">
                                Basic Usage
                            </h3>
                            <HeatmapTable
                                data={exampleData}
                                rowLabels={exampleRowLabels}
                                columnLabels={exampleColumnLabels}
                            />
                        </div>
                        <div class="space-y-3">
                            <h3 class="text-sm font-medium text-zinc-700">
                                With Custom Formatter
                            </h3>
                            <HeatmapTable
                                data={formattedData}
                                rowLabels={exampleRowLabels}
                                columnLabels={["Jan 2025", "Feb 2025"]}
                                valueFormatter={formatHours}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Additional Components Info -->
        <section id="additional-components" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Additional Components
                    </h2>
                    <p class="text-zinc-600">
                        The following components are also available but are
                        typically used in layouts rather than standalone:
                    </p>
                </div>
                <div
                    class="border border-zinc-200 rounded-lg p-6 bg-white space-y-4"
                >
                    <div class="space-y-2">
                        <h3 class="font-medium text-zinc-900">Header</h3>
                        <p class="text-sm text-zinc-600">
                            Navigation header component used in the main layout.
                            Provides site navigation and authentication-aware
                            menu items.
                        </p>
                    </div>
                    <div class="space-y-2">
                        <h3 class="font-medium text-zinc-900">Auth</h3>
                        <p class="text-sm text-zinc-600">
                            Authentication wrapper component that protects
                            routes and handles authentication state. Redirects
                            to login if not authenticated.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <div class="w-screen relative left-1/2 -translate-x-1/2">
            <hr class="w-full border-zinc-200" />
        </div>

        <!-- Component Usage Reference -->
        <section id="component-usage" class="relative">
            <div
                class="w-screen absolute left-1/2 -translate-x-1/2 top-2 pointer-events-none"
            >
                <div class="px-8 pl-16">
                    <Blocks class="w-7 h-7 text-zinc-400 pointer-events-auto" />
                </div>
            </div>
            <div class="space-y-6">
                <div class="space-y-2">
                    <h2
                        class="text-2xl font-semibold text-zinc-900 font-aspekta"
                    >
                        Component Usage
                    </h2>
                    <p class="text-zinc-600">
                        All components are exported from <code
                            class="px-1.5 py-0.5 bg-zinc-100 rounded text-sm"
                            >$lib/components</code
                        > and can be imported individually or as a group.
                    </p>
                </div>
                <div class="border border-zinc-200 rounded-lg p-6 bg-white">
                    <pre
                        class="text-xs text-zinc-700 bg-zinc-50 p-4 rounded-md overflow-x-auto"><code
                            >import &#123;(Button,
                            Modal,
                            Drawer,
                            Select)&#125; from '$lib/components';

// Or import individual components:
import Button from '$lib/components/Button.svelte';</code
                        ></pre>
                </div>
            </div>
        </section>
    </div>
</div>
