<script lang="ts">
    import { Header, Auth } from "$lib/components";
    import ToastContainer from "$lib/components/ToastContainer.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import { page, navigating } from "$app/stores";
    import { afterNavigate } from "$app/navigation";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { initializeTheme } from "$lib/stores/themeStore.svelte";
    import {
        navigationState,
        startLoading,
        stopLoading,
    } from "$lib/stores/navigationStore.svelte";
    import { clientAnalytics } from "$lib/utils/clientAnalytics";
    import { setupViewTransitions } from "$lib/utils/viewTransitionsKit";
    import { initAOS, refreshAOS } from "$lib/utils/aosKit";
    import { initAuth } from "$lib/stores/authStore.svelte";
    import { authStore } from "$lib/stores/authStore";
    import "../app.css";
    import "../style.css";

    // Initialize auth state early (before component renders) to ensure Header has auth data
    if (browser) {
        initAuth();
        authStore.init();
    }

    let { children } = $props();

    // Skip auth wrapper for login page, help page, register routes, deck, password reset routes, and public sharing routes
    let isLoginPage = $derived($page.url.pathname === "/login");
    let isHelpPage = $derived($page.url.pathname.startsWith("/help"));
    let isRegisterPage = $derived($page.url.pathname.startsWith("/register"));
    let isDeckPage = $derived($page.url.pathname === "/deck");
    let isForgotPasswordPage = $derived(
        $page.url.pathname === "/forgot-password",
    );
    let isResetPasswordPage = $derived(
        $page.url.pathname.startsWith("/reset-password"),
    );
    // Public sharing routes: /{entity}/{id}/public/{token}
    let isPublicSharingPage = $derived(
        /^\/(work|cases|projects)\/[^/]+\/public\/[^/]+$/.test(
            $page.url.pathname,
        ),
    );
    let isPublicPage = $derived(
        isLoginPage ||
            isHelpPage ||
            isRegisterPage ||
            isDeckPage ||
            isForgotPasswordPage ||
            isResetPasswordPage ||
            isPublicSharingPage,
    );

    // Track navigation and loading state
    let isNavigating = $derived(!!$navigating);

    // Track if this is the initial page load (not a navigation)
    let isInitialLoad = $state(true);
    let hasStartedInitialLoad = $state(false);

    // Derive loading state from navigation or page-level loading
    // Direct reactive access - no subscribe needed!
    const isLoading = $derived(isNavigating || navigationState.isLoading);

    // Delayed spinner: only show after 500-700ms to prevent flash on fast loads
    let showSpinner = $state(false);
    let spinnerTimeout: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        if (isLoading) {
            // Start random delay before showing spinner
            const delay = 1300 + Math.random() * 700; // 800-1000ms
            spinnerTimeout = setTimeout(() => {
                if (isLoading) {
                    showSpinner = true;
                }
            }, delay);
        } else {
            // Loading finished before (or after) delay — hide immediately
            if (spinnerTimeout) {
                clearTimeout(spinnerTimeout);
                spinnerTimeout = null;
            }
            showSpinner = false;
        }
        return () => {
            if (spinnerTimeout) {
                clearTimeout(spinnerTimeout);
                spinnerTimeout = null;
            }
        };
    });

    // Track previous URL to avoid duplicate tracking
    let previousUrl = $state<string | null>(null);

    // Start loading overlay on initial page load (browser only)
    // This ensures the overlay shows during initial SSR hydration and data loading
    $effect(() => {
        if (
            browser &&
            isInitialLoad &&
            !hasStartedInitialLoad &&
            !isNavigating
        ) {
            hasStartedInitialLoad = true;
            startLoading();
        }
    });

    // When navigation starts, show loader
    $effect(() => {
        if (isNavigating) {
            startLoading();
            // Mark that we're no longer on initial load after first navigation
            if (isInitialLoad) {
                isInitialLoad = false;
            }
        }
    });

    // After navigation completes, wait for page data and components to load
    // This also fires on initial page load
    afterNavigate(async () => {
        // Wait for any page-level loading operations to complete
        // This ensures all data and components are loaded before hiding the overlay
        if (navigationState.pageLoadingCount === 0) {
            // Small delay to ensure components have rendered
            setTimeout(async () => {
                stopLoading();
                // Mark initial load as complete after first navigation completes
                if (isInitialLoad) {
                    isInitialLoad = false;
                }
                // Refresh AOS after navigation to detect new elements
                if (browser) {
                    await refreshAOS();
                }
            }, 150);
        }
    });

    // When page-level loading completes, hide loader after a brief delay
    // This handles cases where page loading finishes after navigation
    $effect(() => {
        if (
            !isNavigating &&
            navigationState.pageLoadingCount === 0 &&
            navigationState.isLoading
        ) {
            const componentLoadingKeys = Object.keys(
                navigationState.componentLoading,
            );

            // Don't block the UI for drawer component loading - let drawers render even if they're loading
            // Only show spinner for page-level operations, not component-level
            const hasOnlyDrawerLoading =
                componentLoadingKeys.length > 0 &&
                componentLoadingKeys.every(
                    (key) =>
                        key.startsWith("CaseDrawer:") ||
                        key.startsWith("Drawer:"),
                );

            if (hasOnlyDrawerLoading) {
                stopLoading();
                return;
            }

            // Give components time to render after data loads
            const timer = setTimeout(() => {
                stopLoading();
                // Mark initial load as complete when loading finishes
                if (isInitialLoad) {
                    isInitialLoad = false;
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    });

    // Initialize theme, analytics, view transitions, and AOS on mount
    onMount(async () => {
        if (browser) {
            initializeTheme();
            // Initialize analytics auto-tracking
            clientAnalytics.setupAutoTracking();
            // Setup view transitions for random page transitions
            setupViewTransitions({
                availableTransitions: [
                    "fade",
                    "slide-left",
                    "slide-right",
                    "slide-up",
                    "scale-up",
                    "blur",
                ],
                enabled: true,
                // Exclude transitions on public pages for faster loading
                excludedRoutes: ["/login", "/register", "/help", "/deck"],
            });
            // Initialize AOS for scroll-triggered element animations
            // Lower offset (0) to detect elements already in viewport on page load
            await initAOS({
                once: true,
                disable: "phone", // Disable on mobile for better performance
                duration: 500,
                easing: "ease-out-cubic",
                offset: 0, // Detect elements already in viewport
            });
        }
    });

    // Track page views on route changes (only when navigation completes and URL actually changed)
    $effect(() => {
        if (browser && $page.url && !isNavigating) {
            const pageUrl = $page.url.pathname + $page.url.search;
            // Only track if URL actually changed
            if (previousUrl !== pageUrl) {
                previousUrl = pageUrl;
                // Wait a tick for page title to be available
                setTimeout(() => {
                    const pageTitle =
                        document.title || "Business Process Management";
                    clientAnalytics.trackPageView(pageUrl, pageTitle);
                }, 0);
            }
        }
    });
</script>

<svelte:head>
    <link rel="icon" href="/img/icon.png" />
    {@html `<script>
		// Initialize theme immediately before page renders
		(function() {
			try {
				const saved = localStorage.getItem('theme');
				const validThemes = ['default', 'catalyst', 'pglite', 'planet', 'trevor', 'cursor', 'dreams'];
				const themeId = saved && validThemes.includes(saved) ? saved : 'default';

				// Apply default theme immediately
				const root = document.documentElement;
				root.style.setProperty('--theme-background', '#ffffff');
				root.style.setProperty('--theme-text-primary', '#18181b');
				root.style.setProperty('--theme-text-secondary', '#52525b');
				root.style.setProperty('--theme-text-muted', '#a1a1aa');
				root.style.setProperty('--theme-border', '#e4e4e7');
				root.style.setProperty('--theme-surface', '#fafafa');
				root.style.setProperty('--theme-focus', '#FE773C');
				root.style.setProperty('--theme-primary', '#3b82f6');

				if (themeId === 'catalyst') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#000000');
					root.style.setProperty('--theme-text-secondary', '#000000');
					root.style.setProperty('--theme-text-muted', '#1a1a1a');
					root.style.setProperty('--theme-border', '#000000');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#3b82f6');
					root.style.setProperty('--theme-secondary', '#facc15');
					root.setAttribute('data-theme', 'catalyst');
				} else if (themeId === 'pglite') {
					root.style.setProperty('--theme-background', '#1a1a1a');
					root.style.setProperty('--theme-text-primary', '#ffffff');
					root.style.setProperty('--theme-text-secondary', '#e4e4e7');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#3f3f46');
					root.style.setProperty('--theme-surface', '#27272a');
					root.style.setProperty('--theme-primary', '#fde047');
					root.style.setProperty('--theme-secondary', '#facc15');
					root.style.setProperty('--theme-focus', '#fde047');
					root.setAttribute('data-theme', 'pglite');
				} else if (themeId === 'planet') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#3a3b36');
					root.style.setProperty('--theme-text-secondary', '#52525b');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#3a3b36');
					root.style.setProperty('--theme-secondary', '#f97316');
					root.style.setProperty('--theme-focus', '#f97316');
					root.setAttribute('data-theme', 'planet');
				} else if (themeId === 'trevor') {
					root.style.setProperty('--theme-background', '#ffffff');
					root.style.setProperty('--theme-text-primary', '#416288');
					root.style.setProperty('--theme-text-secondary', '#3a3b36');
					root.style.setProperty('--theme-text-muted', '#52525b');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#ffca38');
					root.style.setProperty('--theme-secondary', '#416288');
					root.style.setProperty('--theme-focus', '#ffca38');
					root.setAttribute('data-theme', 'trevor');
				} else if (themeId === 'cursor') {
					root.style.setProperty('--theme-background', '#f7f7f4');
					root.style.setProperty('--theme-text-primary', '#26251e');
					root.style.setProperty('--theme-text-secondary', '#52525b');
					root.style.setProperty('--theme-text-muted', '#a1a1aa');
					root.style.setProperty('--theme-border', '#e4e4e7');
					root.style.setProperty('--theme-surface', '#ffffff');
					root.style.setProperty('--theme-primary', '#26251e');
					root.style.setProperty('--theme-secondary', '#f54e00');
					root.style.setProperty('--theme-focus', '#f54e00');
					root.setAttribute('data-theme', 'cursor');
				} else {
					root.setAttribute('data-theme', 'default');
				}
			} catch (e) {
				console.warn('Theme initialization error:', e);
			}
		})();
	</script>`}
</svelte:head>

<!-- Page wrapper -->
{#if isPublicPage}
    <!-- Public pages (login, help) - no header, no auth wrapper -->
    {@render children?.()}
{:else}
    <!-- Protected routes - with header and auth wrapper -->
    <div
        class="flex flex-col h-screen font-[family-name:var(--font-inter)] antialiased tracking-tight overflow-hidden"
        style="background-color: var(--theme-background); color: var(--theme-text-primary);"
    >
        <Header />
        <Auth>
            <main class="flex-1 overflow-y-auto min-h-0">
                {@render children?.()}
            </main>
        </Auth>
        <ToastContainer position="bottom-right" />
    </div>
{/if}

<!-- Global page loading overlay — delayed 500-700ms to prevent flash on fast loads -->
{#if showSpinner}
    <div
        class="fixed inset-0 z-20 flex items-center justify-center"
        style="background-color: rgba(255, 255, 255, 0.9);"
    >
        <Spinner size="xl" />
    </div>
{/if}
