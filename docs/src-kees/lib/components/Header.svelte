<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { authStore } from "$lib/stores/authStore";
    import { authState, getAuth, initAuth } from "$lib/stores/authStore.svelte";
    import { messageStore } from "$lib/stores/messageStore";
    import { sseClient } from "$lib/services/sseClient";
    import MessageBadge from "./MessageBadge.svelte";
    import { breadcrumbState } from "$lib/stores/breadcrumbStore.svelte";
    import DropdownNav, { type DropdownNavItem } from "./DropdownNav.svelte";
    import IconButton from "./IconButton.svelte";
    import Drawer from "./Drawer.svelte";
    import Modal from "./Modal.svelte";
    import AddShortcutModal from "./AddShortcutModal.svelte";
    import ShortcutsDrawer from "./ShortcutsDrawer.svelte";
    // import ThemeSelector from './ThemeSelector.svelte';
    import Breadcrumb from "./Breadcrumb.svelte";
    import type { BreadcrumbItem } from "./Breadcrumb.types";
    import {
        GitBranchPlus,
        SwatchBook,
        House,
        CircleUserRound,
        CirclePower,
        Ellipsis,
        Menu,
        X,
        Users,
        MessageCircleQuestionMark,
        BookmarkPlus,
        Maximize,
        Minimize,
        Bot,
    } from "lucide-svelte";
    import {
        getFilteredNavItems,
        getFilteredAdminDropdownItems,
        getFilteredPlaceholderDropdownItems,
    } from "$lib/utils/navigation";
    import { isSysadmin, hasRole } from "$lib/utils/authGuard";
    import guidesData from "$lib/guides/guides.json";

    /**
     * Navigation item interface
     */
    interface NavItem {
        /**
         * Display label for nav item
         */
        label: string;

        /**
         * URL path for navigation
         */
        href: string;

        /**
         * Dropdown items for flyout menu
         */
        dropdownItems?: Array<{
            label: string;
            href: string;
        }>;
    }

    // Check if user has admin role
    const isAdmin = $derived.by(() => {
        return hasRole("Admin") || isSysadmin();
    });

    // Get filtered navigation items based on permissions
    const navItems = $derived.by(() => {
        return getFilteredNavItems();
    });

    // Admin dropdown items for user management (filtered by permissions)
    const adminDropdownItems = $derived.by(() => {
        return getFilteredAdminDropdownItems();
    });

    // Define DEV dropdown items (only shown in dev mode)
    const devDropdownItems: DropdownNavItem[] = [
        { label: "Bestanden", href: "/files" },
        { label: "Componenten", href: "/cmp" },
        { label: "Testing", href: "/tests" },
        { label: "Designs", href: "/designs" },
        { label: "Deck", href: "/deck" },
        { label: "Walkthru", href: "/walkthru" },
        { label: "File Tree", href: "/docs/file-tree" },
    ];

    // Dropdown items for ellipsis menu (filtered by permissions)
    const placeholderDropdownItems = $derived.by(() => {
        return getFilteredPlaceholderDropdownItems();
    });

    // Initialize auth state synchronously (before component renders)
    if (browser) {
        initAuth();
        authStore.init();
    }

    // Derive authenticated state from reactive authState
    // This will reactively update when authState changes
    const isAuthenticated = $derived.by(() => {
        if (!browser) return false;
        const auth = authState.value;
        // Check both authState and localStorage for backward compatibility
        return !!(
            auth?.token &&
            (localStorage.getItem("auth") === "true" || auth.user)
        );
    });

    let unreadCount = $state(0);
    let mobileMenuOpen = $state(false);
    let helpModalOpen = $state(false);
    let addShortcutModalOpen = $state(false);
    let shortcutsDrawerOpen = $state(false);
    let isFullscreen = $state(false);

    function toggleFullscreen() {
        if (!browser) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
            isFullscreen = false;
        } else {
            document.documentElement.requestFullscreen();
            isFullscreen = true;
        }
    }

    function handleFullscreenChange() {
        if (!browser) return;
        isFullscreen = !!document.fullscreenElement;
    }

    // Helper to match URL pattern against current page URL
    const matchUrlPattern = (pattern: string): boolean => {
        const pathname = $page.url.pathname;
        const searchParams = $page.url.searchParams;
        const segments = pathname.split("/").filter(Boolean);
        const patternPath = pattern.split("?")[0];
        const patternSegments = patternPath.split("/").filter(Boolean);
        const patternQuery = pattern.split("?")[1];

        // Check if segment count matches
        if (segments.length !== patternSegments.length) {
            return false;
        }

        // Check each segment
        for (let i = 0; i < segments.length; i++) {
            const patternSegment = patternSegments[i];
            if (
                patternSegment.startsWith("[") &&
                patternSegment.endsWith("]")
            ) {
                // Dynamic segment - matches any value
                continue;
            }
            if (patternSegment !== segments[i]) {
                return false;
            }
        }

        // Check query parameters if pattern has them
        if (patternQuery) {
            const queryPairs = patternQuery.split("&");
            for (const pair of queryPairs) {
                const [key, value] = pair.split("=");
                const paramValue = searchParams.get(key);
                // Convert to string for comparison and handle undefined
                if (String(paramValue || "") !== String(value || "")) {
                    return false;
                }
            }
        }
        return true;
    };

    // Derive current guide by matching URL patterns from guides.json
    const currentGuide = $derived.by(() => {
        const guides = guidesData as Record<string, (typeof guidesData)["/"]>;

        // Sort patterns by specificity - patterns with query params should be checked first
        const sortedPatterns = Object.entries(guides).sort(
            ([patternA], [patternB]) => {
                const aHasQuery = patternA.includes("?");
                const bHasQuery = patternB.includes("?");
                // If both have or both don't have query params, maintain order
                if (aHasQuery === bHasQuery) return 0;
                // Patterns with query params should come first
                return aHasQuery ? -1 : 1;
            },
        );

        // Iterate through sorted guide keys (which are URL patterns)
        for (const [pattern, guide] of sortedPatterns) {
            if (matchUrlPattern(pattern)) {
                return guide;
            }
        }
        return null;
    });

    // Subscribe to message store
    messageStore.subscribe((state) => {
        unreadCount = state.unreadCount;
    });

    // Watch auth state changes and manage message polling
    let previousAuthState = $state(false);

    $effect(() => {
        const currentAuth = isAuthenticated;

        // Update connection status from SSE client

        // Start/stop message polling based on auth state changes
        if (currentAuth && !previousAuthState) {
            // Just became authenticated
            messageStore.startPolling(60000);
        } else if (!currentAuth && previousAuthState) {
            // Just became unauthenticated
            messageStore.stopPolling();
            messageStore.reset();
        }

        previousAuthState = currentAuth;
    });

    onMount(() => {
        // Initialize previous auth state
        previousAuthState = isAuthenticated;

        // Start polling if already authenticated
        if (isAuthenticated) {
            messageStore.startPolling(60000);
        }

        // Listen for storage changes to sync auth state (cross-tab sync)
        if (browser) {
            const handleStorage = () => {
                // Re-initialize auth from localStorage when storage changes
                initAuth();
                authStore.init();
            };

            window.addEventListener("storage", handleStorage);
            // Also check on focus in case auth changed in another tab
            window.addEventListener("focus", handleStorage);

            return () => {
                messageStore.stopPolling();
                window.removeEventListener("storage", handleStorage);
                window.removeEventListener("focus", handleStorage);
            };
        }

        return () => {
            messageStore.stopPolling();
        };
    });

    $effect(() => {
        if (browser) {
            document.addEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
            return () => {
                document.removeEventListener(
                    "fullscreenchange",
                    handleFullscreenChange,
                );
            };
        }
    });

    function logout() {
        if (!browser) return;
        authStore.clearAuth();
        localStorage.removeItem("auth_data");
        localStorage.removeItem("auth");
        localStorage.removeItem("authorized");
        window.location.href = "/";
    }

    function handleNavClick(event: MouseEvent, href: string) {
        event.preventDefault();
        goto(href);
    }

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }

    function handleMobileNavClick(event: MouseEvent, href: string) {
        event.preventDefault();
        closeMobileMenu();
        goto(href);
    }

    // Generate breadcrumb items based on current route
    const breadcrumbItems = $derived.by((): BreadcrumbItem[] => {
        const pathname = $page.url.pathname;
        const items: BreadcrumbItem[] = [];
        // Direct reactive access - no subscribe needed!
        const entityMap = breadcrumbState.entityNames;

        // Map path segments to labels
        const pathSegments = pathname.split("/").filter(Boolean);

        if (pathSegments.length === 0) {
            // Home page - show just Home
            return [{ label: "Home" }];
        }

        // Always start with Home (for non-home pages)
        items.push({ label: "Home", href: "/" });

        // Build breadcrumb path
        let currentPath = "";
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;

            // Map segment to label
            let label = segment;

            // Handle known routes
            if (segment === "work") {
                label = "Werk";
            } else if (segment === "kees") {
                label = "Kees";
            } else if (segment === "backlog") {
                label = "Backlog";
            } else if (segment === "processes") {
                label = "Processen";
            } else if (segment === "cases") {
                label = "Cases";
            } else if (segment === "messages") {
                label = "Berichten";
            } else if (segment === "files") {
                label = "Bestanden";
            } else if (segment === "gebruikers") {
                label = "Gebruikers";
            } else if (segment === "projects") {
                label = "Projecten";
            } else if (segment === "account") {
                label = "Account";
            } else if (segment === "login") {
                label = "Inloggen";
            } else if (segment === "cmp") {
                label = "Componenten";
            } else if (segment === "tests") {
                label = "Testing";
            } else if (segment === "designs") {
                label = "Designs";
            } else if (segment === "admin") {
                label = "Beheer";
            } else if (segment === "dashboard") {
                label = "Dashboard";
            } else if (segment === "new") {
                label = "Nieuw";
            } else if (segment === "edit") {
                label = "Bewerken";
            } else if (/^\d+$/.test(segment)) {
                // Numeric ID - could be case ID, process ID, etc.
                // First check if there's an entity name in the breadcrumb store
                const entityName = entityMap.get(currentPath);
                if (entityName) {
                    label = entityName;
                } else {
                    // Fallback to generic labels based on previous segment
                    const prevSegment = pathSegments[index - 1];
                    if (prevSegment === "cases") {
                        label = `Case ${segment}`;
                    } else if (prevSegment === "processes") {
                        label = `Proces ${segment}`;
                    } else if (prevSegment === "work") {
                        label = `Item ${segment}`;
                    } else if (prevSegment === "projects") {
                        label = `Project ${segment}`;
                    } else {
                        label = segment;
                    }
                }
            } else {
                // Check breadcrumb store first for any custom entity names
                const entityName = entityMap.get(currentPath);
                if (entityName) {
                    label = entityName;
                } else {
                    // Capitalize first letter for unknown segments
                    label = segment.charAt(0).toUpperCase() + segment.slice(1);
                }
            }

            // Last item doesn't have href
            if (isLast) {
                items.push({ label });
            } else {
                items.push({ label, href: currentPath });
            }
        });

        return items;
    });

    // Get current user name for breadcrumb display
    const currentUserName = $derived.by(() => {
        const authData = authState.value;
        if (!authData?.user) return undefined;
        return (
            authData.user.name ||
            authData.user.username ||
            authData.user.email ||
            undefined
        );
    });

    // Get current page title from breadcrumb (for shortcuts)
    const currentPageTitle = $derived.by(() => {
        const items = breadcrumbItems;
        if (items.length === 0) return "Home";
        // Get the last breadcrumb item (current page)
        const lastItem = items[items.length - 1];
        return lastItem?.label || "Home";
    });

    // Get current URL for shortcuts
    const currentUrl = $derived($page.url.pathname + $page.url.search);
</script>

<header
    class="sticky top-0 w-full z-30 border-b"
    style="background-color: var(--theme-background); border-color: var(--theme-border);"
>
    <div class="w-full">
        <!-- Mobile Header -->
        <div class="flex lg:hidden items-center justify-between h-16 px-4">
            <!-- Logo -->
            <button
                onclick={(e) => handleNavClick(e, "/")}
                class="flex items-center justify-center"
                aria-label="Home"
            >
                <img
                    src="/img/icon.png"
                    alt="Hoi Pippeloi Kindercentrum"
                    class="h-7 w-auto"
                />
            </button>

            <!-- Mobile Menu Button -->
            <button
                onclick={toggleMobileMenu}
                class="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                aria-label="Toggle menu"
            >
                {#if mobileMenuOpen}
                    <X class="w-6 h-6" />
                {:else}
                    <Menu class="w-6 h-6" />
                {/if}
            </button>
        </div>

        <!-- Desktop Header -->
        <div class="hidden lg:flex items-center justify-between h-16 px-8">
            <!-- Site branding -->
            <div class="shrink-0 mr-4">
                <!-- Logo -->
                <button
                    onclick={(e) => handleNavClick(e, "/")}
                    class="flex items-center justify-center"
                    aria-label="Home"
                >
                    <img
                        src="/img/icon.png"
                        alt="Hoi Pippeloi Kindercentrum"
                        class="h-7 w-auto"
                    />
                </button>
            </div>

            <!-- Desktop navigation -->
            <nav class="flex grow">
                <!-- Desktop navigation links -->
                {#if navItems.length > 0}
                    <ul
                        class="flex grow justify-start flex-wrap items-center gap-1"
                    >
                        {#each navItems as item}
                            {@const isActive = $page.url.pathname === item.href}
                            <li>
                                {#if item.dropdownItems && item.dropdownItems.length > 0}
                                    <DropdownNav
                                        label={item.label}
                                        items={item.dropdownItems}
                                        position="left"
                                        showBorder={false}
                                        hoverTrigger={true}
                                        hideArrow={true}
                                        {isActive}
                                        onmainclick={() => {
                                            if (browser) {
                                                goto(item.href);
                                            }
                                        }}
                                        onitemclick={(dropdownItem) => {
                                            if (
                                                browser &&
                                                dropdownItem.href !== "#"
                                            ) {
                                                goto(dropdownItem.href);
                                            }
                                        }}
                                    />
                                {:else}
                                    <button
                                        onclick={(e) =>
                                            handleNavClick(e, item.href)}
                                        class="nav-item relative text-sm font-medium px-3 lg:px-5 py-2 flex items-center transition rounded-md {isActive
                                            ? 'text-zinc-900 bg-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-900'}"
                                    >
                                        {#if item.label === "Home"}
                                            <House class="w-4 h-4" />
                                        {:else}
                                            {item.label}
                                        {/if}
                                        {#if item.label === "Berichten"}
                                            <MessageBadge count={unreadCount} />
                                        {/if}
                                    </button>
                                {/if}
                            </li>
                        {/each}
                        {#if placeholderDropdownItems.length > 0}
                            <li>
                                <DropdownNav
                                    icon={Ellipsis}
                                    items={placeholderDropdownItems}
                                    position="left"
                                    showBorder={false}
                                    onitemclick={(item) => {
                                        if (browser && item.href !== "#") {
                                            goto(item.href);
                                        }
                                    }}
                                />
                            </li>
                        {/if}
                    </ul>
                {/if}

                <!-- Desktop sign in links -->
                <ul class="flex grow justify-end flex-wrap items-center gap-2">
                    <!-- Admin dropdown - available in all environments when user has admin role -->
                    {#if isAdmin}
                        <li>
                            <DropdownNav
                                icon={Users}
                                items={adminDropdownItems}
                                position="right"
                                showBorder={false}
                                tooltip="Gebruikers en rechten"
                                tooltipPosition="left"
                                onitemclick={(item) => {
                                    if (browser && item.href !== "#") {
                                        goto(item.href);
                                    }
                                }}
                            />
                        </li>
                    {/if}

                    {#if import.meta.env.DEV}
                        <li>
                            <DropdownNav
                                icon={GitBranchPlus}
                                items={devDropdownItems}
                                position="right"
                                showBorder={false}
                                onitemclick={(item) => {
                                    if (browser && item.href !== "#") {
                                        goto(item.href);
                                    }
                                }}
                            />
                        </li>
                    {/if}

                    <li>
                        <IconButton
                            icon={Bot}
                            variant="ghost"
                            tooltip="Sjoerd"
                            tooltipPosition="left"
                            onclick={(e) => handleNavClick(e, "/sjoerd")}
                        />
                    </li>

                    <!-- Theme selector -->
                    <!-- <li>
							<ThemeSelector />
						</li> -->

                    {#if isAuthenticated}
                        <!-- Add Shortcut button -->
                        <li>
                            <IconButton
                                icon={BookmarkPlus}
                                variant="ghost"
                                tooltip="Snelkoppeling toevoegen"
                                tooltipPosition="left"
                                onclick={() => (addShortcutModalOpen = true)}
                            />
                        </li>
                        <!-- Help button - shown when guide exists for current route -->
                        {#if currentGuide}
                            <li>
                                <IconButton
                                    icon={MessageCircleQuestionMark}
                                    variant="ghost"
                                    tooltip="Hulp"
                                    tooltipPosition="left"
                                    onclick={() => (helpModalOpen = true)}
                                />
                            </li>
                        {/if}
                        <li>
                            <IconButton
                                icon={CirclePower}
                                variant="ghost"
                                tooltip="Log uit"
                                tooltipPosition="left"
                                onclick={logout}
                            />
                        </li>
                        <!-- Fullscreen toggle - visible on landscape tablets (1024-1399px) -->
                        <li class="hidden tablet-landscape-show">
                            <IconButton
                                icon={isFullscreen ? Minimize : Maximize}
                                variant="ghost"
                                tooltip={isFullscreen
                                    ? "Volledig scherm afsluiten"
                                    : "Volledig scherm"}
                                tooltipPosition="left"
                                onclick={toggleFullscreen}
                            />
                        </li>
                        <li>
                            <IconButton
                                icon={CircleUserRound}
                                variant="ghost"
                                tooltip="Account"
                                tooltipPosition="left"
                                onclick={(e) => handleNavClick(e, "/account")}
                            />
                        </li>
                    {:else}
                        <li>
                            <button
                                onclick={(e) => handleNavClick(e, "/login")}
                                class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 lg:px-5 py-2 flex items-center transition"
                            >
                                Inloggen
                            </button>
                        </li>
                    {/if}
                </ul>
            </nav>
        </div>

        <!-- Breadcrumb Navigation -->
        <Breadcrumb items={breadcrumbItems} userName={currentUserName} />
    </div>

    <!-- Mobile Menu Drawer -->
    <Drawer
        open={mobileMenuOpen}
        position="right"
        onclose={closeMobileMenu}
        class="w-[85vw] max-w-sm"
    >
        <div class="flex flex-col h-full">
            <!-- Mobile Navigation Links -->
            <nav class="flex-1">
                <ul class="flex flex-col gap-1">
                    {#each navItems as item}
                        <li>
                            <button
                                onclick={(e) =>
                                    handleMobileNavClick(e, item.href)}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center justify-between transition rounded-md {item.label ===
                                'Berichten'
                                    ? 'relative'
                                    : ''}"
                                class:text-zinc-900={$page.url.pathname ===
                                    item.href}
                                class:bg-zinc-100={$page.url.pathname ===
                                    item.href}
                                class:text-zinc-500={$page.url.pathname !==
                                    item.href}
                                class:hover:text-zinc-900={$page.url
                                    .pathname !== item.href}
                                class:hover:bg-zinc-50={$page.url.pathname !==
                                    item.href}
                            >
                                <div class="flex items-center gap-3">
                                    {#if item.label === "Home"}
                                        <House class="w-5 h-5" />
                                    {/if}
                                    <span>{item.label}</span>
                                </div>
                                {#if item.label === "Berichten"}
                                    <MessageBadge count={unreadCount} />
                                {/if}
                            </button>
                        </li>
                    {/each}

                    <!-- Ellipsis Menu Items -->
                    {#each placeholderDropdownItems as item}
                        <li>
                            <button
                                onclick={(e) =>
                                    handleMobileNavClick(e, item.href)}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                            >
                                {item.label}
                            </button>
                        </li>
                    {/each}
                </ul>
            </nav>

            <!-- Mobile Action Buttons -->
            <div class="border-t border-zinc-200 pt-4 mt-4">
                <ul class="flex flex-col gap-2">
                    <!-- Admin section - available in all environments when user has admin role -->
                    {#if isAdmin}
                        <li class="px-4 py-2">
                            <div
                                class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
                            >
                                Beheer
                            </div>
                            <div class="flex flex-col gap-1">
                                {#each adminDropdownItems as item}
                                    <button
                                        onclick={(e) =>
                                            handleMobileNavClick(e, item.href)}
                                        class="w-full text-left text-sm font-medium px-3 py-2 flex items-center gap-3 transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                    >
                                        {item.label}
                                    </button>
                                {/each}
                            </div>
                        </li>
                    {/if}

                    {#if import.meta.env.DEV}
                        {#each devDropdownItems as item}
                            <li>
                                <button
                                    onclick={(e) =>
                                        handleMobileNavClick(e, item.href)}
                                    class="w-full text-left text-sm font-medium px-4 py-3 flex items-center transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                >
                                    {item.label}
                                </button>
                            </li>
                        {/each}
                    {/if}

                    {#if isAuthenticated}
                        <!-- Help button - shown when guide exists for current route -->
                        {#if currentGuide}
                            <li>
                                <button
                                    onclick={() => {
                                        helpModalOpen = true;
                                        closeMobileMenu();
                                    }}
                                    class="w-full text-left text-sm font-medium px-4 py-3 flex items-center gap-3 transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                >
                                    <MessageCircleQuestionMark
                                        class="w-5 h-5"
                                    />
                                    <span>Hulp</span>
                                </button>
                            </li>
                        {/if}
                        <li>
                            <button
                                onclick={(e) => {
                                    handleMobileNavClick(e, "/account");
                                }}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center gap-3 transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                            >
                                <CircleUserRound class="w-5 h-5" />
                                <span>Account</span>
                            </button>
                        </li>
                        <!-- Fullscreen toggle (portrait tablets) -->
                        <li>
                            <button
                                onclick={() => {
                                    toggleFullscreen();
                                    closeMobileMenu();
                                }}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center gap-3 transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                            >
                                {#if isFullscreen}
                                    <Minimize class="w-5 h-5" />
                                    <span>Volledig scherm afsluiten</span>
                                {:else}
                                    <Maximize class="w-5 h-5" />
                                    <span>Volledig scherm</span>
                                {/if}
                            </button>
                        </li>
                        <li>
                            <button
                                onclick={() => {
                                    logout();
                                    closeMobileMenu();
                                }}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center gap-3 transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                            >
                                <CirclePower class="w-5 h-5" />
                                <span>Log uit</span>
                            </button>
                        </li>
                    {:else}
                        <li>
                            <button
                                onclick={(e) =>
                                    handleMobileNavClick(e, "/login")}
                                class="w-full text-left text-sm font-medium px-4 py-3 flex items-center transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                            >
                                Inloggen
                            </button>
                        </li>
                    {/if}
                </ul>
            </div>
        </div>
    </Drawer>

    <!-- Help Modal -->
    {#if currentGuide}
        <Modal
            bind:open={helpModalOpen}
            title={currentGuide.title}
            size="custom"
            customWidth="40vw"
            maxContentHeight="60vh"
        >
            <div class="space-y-6">
                {#each currentGuide.sections as section}
                    <div class="space-y-2">
                        <h3
                            class="text-lg font-semibold text-zinc-900 font-aspekta"
                        >
                            {section.heading}
                        </h3>
                        {#if section.content}
                            <p class="text-zinc-700 leading-relaxed">
                                {section.content}
                            </p>
                        {/if}
                        {#if section.items}
                            <ul class="space-y-2 mt-3">
                                {#each section.items as item}
                                    <li
                                        class="flex items-start gap-2 text-zinc-700"
                                    >
                                        <span
                                            class="text-orange-500 leading-relaxed"
                                            >•</span
                                        >
                                        <span class="flex-1 leading-relaxed"
                                            >{@html item.replace(
                                                /\*\*(.*?)\*\*/g,
                                                '<strong class="font-semibold text-zinc-900">$1</strong>',
                                            )}</span
                                        >
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                {/each}
            </div>
        </Modal>
    {/if}

    <!-- Add Shortcut Modal -->
    <Modal
        bind:open={addShortcutModalOpen}
        title="Snelkoppeling toevoegen"
        size="md"
    >
        <AddShortcutModal
            pageTitle={currentPageTitle}
            {currentUrl}
            onclose={() => (addShortcutModalOpen = false)}
            onopenShortcutsDrawer={() => {
                addShortcutModalOpen = false;
                shortcutsDrawerOpen = true;
            }}
        />
    </Modal>

    <!-- Shortcuts Drawer -->
    <ShortcutsDrawer
        bind:open={shortcutsDrawerOpen}
        pageTitle={currentPageTitle}
        {currentUrl}
        onclose={() => (shortcutsDrawerOpen = false)}
    />
</header>

<style>
    /* Nav item hover effect - override global bg-zinc-50 rule */
    :global(
        header nav ul li button.nav-item:not([class*="bg-zinc-100"]):hover
    ) {
        background-color: rgb(250 250 250) !important; /* zinc-50 */
    }

    /* Ensure non-active nav items have transparent background by default */
    :global(header nav ul li button.nav-item:not([class*="bg-zinc-100"])) {
        background-color: transparent !important;
    }
</style>
