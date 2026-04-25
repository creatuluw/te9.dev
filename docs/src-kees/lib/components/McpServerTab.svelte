<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { toastStore } from "$lib/stores/toastStore";
    import {
        Copy,
        Check,
        Terminal,
        Key,
        AlertTriangle,
        Server,
        Eye,
        EyeOff,
        RefreshCw,
        Trash2,
        Plus,
        X,
        ShieldAlert,
        Info,
    } from "lucide-svelte";

    // ---------------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------------

    interface ApiTokenInfo {
        id: number;
        name: string;
        token_prefix: string;
        last_used_at: string | null;
        created_at: string;
        expires_at: string | null;
    }

    interface CreatedApiToken {
        token: string;
        id: number;
        name: string;
        token_prefix: string;
        created_at: string;
    }

    // ---------------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------------

    const MCP_SERVER_URL =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
            ? "http://localhost:3001"
            : "https://kees-mcp-production.up.railway.app";

    const API_BASE = "/api/auth/api-tokens";

    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------

    let tokens = $state<ApiTokenInfo[]>([]);
    let loading = $state(true);
    let creating = $state(false);
    let copiedSection = $state<string | null>(null);

    // New token display (shown once after create/refresh)
    let newTokenData = $state<CreatedApiToken | null>(null);
    let newTokenVisible = $state(false);
    let showNewTokenBanner = $state(false);
    let revealedToken = $state<string | null>(null);

    // Confirmation dialog
    let confirmRefreshId = $state<number | null>(null);
    let confirmRefreshPrefix = $state("");
    let refreshing = $state(false);

    // Revoking
    let revokingId = $state<number | null>(null);

    // ---------------------------------------------------------------------------
    // API helpers
    // ---------------------------------------------------------------------------

    function getAuthHeaders(): Record<string, string> | null {
        const auth = authStore.getAuth();
        if (!auth?.token) return null;
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
        };
    }

    // ---------------------------------------------------------------------------
    // Load tokens
    // ---------------------------------------------------------------------------

    onMount(() => {
        loadTokens();
    });

    async function loadTokens() {
        loading = true;
        const headers = getAuthHeaders();
        if (!headers) {
            loading = false;
            return;
        }

        try {
            const response = await fetch(API_BASE, { headers });
            const result = await response.json();

            if (result.success) {
                tokens = result.data;
                // Reveal the first token for config generation
                if (result.data.length > 0 && !newTokenData) {
                    await revealFirstToken(result.data[0].id, headers);
                }
            }
        } catch (error) {
            console.error("Failed to load API tokens:", error);
        } finally {
            loading = false;
        }
    }

    async function revealFirstToken(
        tokenId: number,
        headers: Record<string, string>,
    ) {
        try {
            const response = await fetch(`${API_BASE}/${tokenId}/reveal`, {
                headers,
            });
            const result = await response.json();

            if (result.success) {
                revealedToken = result.data.token;
            }
        } catch (error) {
            // Silently fail — config will show placeholder
            console.error("Failed to reveal token:", error);
        }
    }

    // ---------------------------------------------------------------------------
    // Create token
    // ---------------------------------------------------------------------------

    async function handleCreateToken() {
        const headers = getAuthHeaders();
        if (!headers) {
            toastStore.add("Je moet ingelogd zijn", "error");
            return;
        }

        creating = true;
        try {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers,
                body: JSON.stringify({ name: "MCP Token" }),
            });
            const result = await response.json();

            if (result.success) {
                newTokenData = result.data;
                newTokenVisible = true;
                showNewTokenBanner = true;
                revealedToken = result.data.token;
                await loadTokens();
                toastStore.add("API token aangemaakt!", "success");
            } else {
                toastStore.add(
                    result.error || "Kon token niet aanmaken",
                    "error",
                );
            }
        } catch (error) {
            console.error("Failed to create token:", error);
            toastStore.add("Er ging iets mis", "error");
        } finally {
            creating = false;
        }
    }

    // ---------------------------------------------------------------------------
    // Refresh token (with confirmation)
    // ---------------------------------------------------------------------------

    function requestRefresh(tokenId: number, prefix: string) {
        confirmRefreshId = tokenId;
        confirmRefreshPrefix = prefix;
    }

    function cancelRefresh() {
        confirmRefreshId = null;
        confirmRefreshPrefix = "";
    }

    async function confirmRefreshToken() {
        if (!confirmRefreshId) return;

        const headers = getAuthHeaders();
        if (!headers) {
            toastStore.add("Je moet ingelogd zijn", "error");
            return;
        }

        refreshing = true;
        try {
            const response = await fetch(
                `${API_BASE}/${confirmRefreshId}/refresh`,
                {
                    method: "POST",
                    headers,
                },
            );
            const result = await response.json();

            if (result.success) {
                newTokenData = result.data;
                newTokenVisible = true;
                showNewTokenBanner = true;
                revealedToken = result.data.token;
                await loadTokens();
                toastStore.add(
                    "Token vernieuwd! Werk je MCP configuratie bij.",
                    "success",
                );
            } else {
                toastStore.add(
                    result.error || "Kon token niet vernieuwen",
                    "error",
                );
            }
        } catch (error) {
            console.error("Failed to refresh token:", error);
            toastStore.add("Er ging iets mis", "error");
        } finally {
            refreshing = false;
            confirmRefreshId = null;
            confirmRefreshPrefix = "";
        }
    }

    // ---------------------------------------------------------------------------
    // Revoke token
    // ---------------------------------------------------------------------------

    async function handleRevoke(tokenId: number) {
        const headers = getAuthHeaders();
        if (!headers) {
            toastStore.add("Je moet ingelogd zijn", "error");
            return;
        }

        revokingId = tokenId;
        try {
            const response = await fetch(`${API_BASE}/${tokenId}`, {
                method: "DELETE",
                headers,
            });
            const result = await response.json();

            if (result.success) {
                // If this was the token being shown, clear it
                if (newTokenData?.id === tokenId) {
                    newTokenData = null;
                }
                revealedToken = null;
                await loadTokens();
                toastStore.add("Token ingetrokken", "success");
            } else {
                toastStore.add(
                    result.error || "Kon token niet intrekken",
                    "error",
                );
            }
        } catch (error) {
            console.error("Failed to revoke token:", error);
            toastStore.add("Er ging iets mis", "error");
        } finally {
            revokingId = null;
        }
    }

    // ---------------------------------------------------------------------------
    // Copy
    // ---------------------------------------------------------------------------

    async function copyToClipboard(text: string, section: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedSection = section;
            toastStore.add("Gekopieerd naar klembord!", "success");
            setTimeout(() => {
                copiedSection = null;
            }, 2000);
        } catch {
            toastStore.add(
                "Kopiëren mislukt, probeer handmatig te kopiëren",
                "error",
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Format helpers
    // ---------------------------------------------------------------------------

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "Nooit";
        const date = new Date(dateStr);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function maskToken(token: string): string {
        return `${token.substring(0, 12)}${"•".repeat(24)}${token.substring(token.length - 8)}`;
    }

    // ---------------------------------------------------------------------------
    // Config generators
    // ---------------------------------------------------------------------------

    const connectionUrl = $derived(
        typeof window !== "undefined" &&
            window.location.hostname === "localhost"
            ? "http://localhost:3001/mcp"
            : "https://kees-mcp-production.up.railway.app/mcp",
    );

    const hasToken = $derived(newTokenData !== null || tokens.length > 0);
    const configToken = $derived(
        newTokenData?.token ?? revealedToken ?? "<JOUW_API_TOKEN>",
    );

    // Client config sub-tabs
    type ClientTabId =
        | "claude-desktop"
        | "claude-cli"
        | "chatgpt"
        | "cursor"
        | "vscode"
        | "zed"
        | "opencode";

    const clientTabs: { id: ClientTabId; label: string }[] = [
        { id: "claude-desktop", label: "Claude Desktop" },
        { id: "claude-cli", label: "Claude CLI" },
        { id: "chatgpt", label: "ChatGPT" },
        { id: "cursor", label: "Cursor" },
        { id: "vscode", label: "VS Code" },
        { id: "zed", label: "Zed" },
        { id: "opencode", label: "OpenCode" },
    ];
    let configClientTab = $state<ClientTabId>("claude-desktop");

    // Claude Desktop (uses SSE endpoint)
    const claudeDesktopConfig = $derived(
        JSON.stringify(
            {
                mcpServers: {
                    kees: {
                        url: connectionUrl.replace("/mcp", "/sse"),
                        headers: {
                            Authorization: `Bearer ${configToken}`,
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // Claude CLI
    const claudeCliConfig = $derived(
        `claude mcp add-json kees '${JSON.stringify({
            type: "http",
            url: connectionUrl,
            headers: {
                Authorization: `Bearer ${configToken}`,
            },
        })}'`,
    );

    // ChatGPT
    const chatgptConfig = $derived(
        JSON.stringify(
            {
                mcpServers: {
                    kees: {
                        type: "http",
                        url: connectionUrl,
                        headers: {
                            Authorization: `Bearer ${configToken}`,
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // Cursor
    const cursorConfig = $derived(
        JSON.stringify(
            {
                mcp: {
                    servers: {
                        kees: {
                            url: connectionUrl,
                            headers: {
                                Authorization: `Bearer ${configToken}`,
                            },
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // VS Code / Copilot
    const vscodeConfig = $derived(
        JSON.stringify(
            {
                servers: {
                    kees: {
                        url: connectionUrl,
                        headers: {
                            Authorization: `Bearer ${configToken}`,
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // Zed
    const zedConfig = $derived(
        JSON.stringify(
            {
                mcpServers: {
                    kees: {
                        type: "http",
                        url: connectionUrl,
                        headers: {
                            Authorization: `Bearer ${configToken}`,
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // OpenCode
    const opencodeConfig = $derived(
        JSON.stringify(
            {
                mcpServers: {
                    kees: {
                        type: "http",
                        url: connectionUrl,
                        headers: {
                            Authorization: `Bearer ${configToken}`,
                        },
                    },
                },
            },
            null,
            2,
        ),
    );

    // Map tab ID → config + metadata
    const clientConfigMap = $derived({
        "claude-desktop": {
            config: claudeDesktopConfig,
            file: "claude_desktop_config.json",
            description: "Plak dit in je Claude Desktop configuratiebestand.",
        },
        "claude-cli": {
            config: claudeCliConfig,
            file: "Terminal",
            description:
                "Voer dit commando uit in je terminal om de server toe te voegen.",
        },
        chatgpt: {
            config: chatgptConfig,
            file: "ChatGPT MCP Settings",
            description:
                "Configureer dit in je ChatGPT Developer instellingen.",
        },
        cursor: {
            config: cursorConfig,
            file: "Settings → MCP",
            description: "Plak dit in Cursor Settings → MCP.",
        },
        vscode: {
            config: vscodeConfig,
            file: ".vscode/mcp.json",
            description: "Maak of bewerk .vscode/mcp.json in je projectmap.",
        },
        zed: {
            config: zedConfig,
            file: "settings.json",
            description: "Voeg dit toe aan je Zed settings.json.",
        },
        opencode: {
            config: opencodeConfig,
            file: "opencode.json",
            description: "Plak dit in je opencode.json configuratiebestand.",
        },
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-blue-50 rounded-lg">
                <Server class="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h2 class="text-xl font-semibold font-aspekta text-zinc-900">
                    MCP Server
                </h2>
                <p class="text-sm text-zinc-500 font-inter">
                    Verbind AI-assistenten met je Kees account
                </p>
            </div>
        </div>

        <div class="mt-4 prose prose-sm text-zinc-600 font-inter max-w-none">
            <p>
                Met de Model Context Protocol (MCP) server kun je AI-assistenten
                zoals Claude Desktop, Cursor of Copilot koppelen aan je Kees
                account. Dit stelt ze in staat om direct taken aan te maken in
                je werkruimte.
            </p>
        </div>
    </div>

    <!-- API Token Management -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <Key class="w-4 h-4 text-zinc-500" />
                <h3 class="text-lg font-semibold font-aspekta text-zinc-900">
                    API Tokens
                </h3>
            </div>
            {#if !loading && tokens.length < 5}
                <button
                    onclick={handleCreateToken}
                    disabled={creating}
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-inter rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus class="w-3.5 h-3.5" />
                    {creating ? "Aanmaken..." : "Nieuw token"}
                </button>
            {/if}
        </div>

        <p class="text-sm text-zinc-600 mb-4 font-inter">
            API tokens zijn blijvend en veranderen niet bij het inloggen. Alleen
            jij kunt een token vernieuwen of intrekken.
        </p>

        {#if loading}
            <div class="flex items-center justify-center py-8 text-zinc-400">
                <svg
                    class="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                Tokens laden...
            </div>
        {:else if tokens.length === 0 && !newTokenData}
            <div
                class="p-6 bg-zinc-50 border border-zinc-200 rounded-lg text-center"
            >
                <Key class="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <p class="text-sm text-zinc-500 font-inter mb-4">
                    Je hebt nog geen API token. Maak er een aan om je MCP client
                    te verbinden.
                </p>
                <button
                    onclick={handleCreateToken}
                    disabled={creating}
                    class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-inter rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus class="w-4 h-4" />
                    {creating ? "Aanmaken..." : "Token aanmaken"}
                </button>
            </div>
        {:else}
            <div class="space-y-3">
                {#each tokens as tokenItem (tokenItem.id)}
                    <div
                        class="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg"
                    >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <code
                                    class="text-sm font-mono text-zinc-700 font-medium"
                                >
                                    {tokenItem.name}
                                </code>
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-200 text-zinc-600"
                                >
                                    {tokenItem.token_prefix}...
                                </span>
                            </div>
                            <div
                                class="flex items-center gap-3 mt-1 text-xs text-zinc-400 font-inter"
                            >
                                <span
                                    >Aangemaakt: {formatDate(
                                        tokenItem.created_at,
                                    )}</span
                                >
                                <span
                                    >Laatst gebruikt: {formatDate(
                                        tokenItem.last_used_at,
                                    )}</span
                                >
                            </div>
                        </div>
                        <div class="flex items-center gap-1 ml-3 shrink-0">
                            <button
                                onclick={() =>
                                    requestRefresh(
                                        tokenItem.id,
                                        tokenItem.token_prefix,
                                    )}
                                disabled={refreshing || revokingId !== null}
                                class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-inter text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Token vernieuwen"
                            >
                                <RefreshCw class="w-3.5 h-3.5" />
                                Vernieuw
                            </button>
                            <button
                                onclick={() => handleRevoke(tokenItem.id)}
                                disabled={revokingId !== null}
                                class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-inter text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Token intrekken"
                            >
                                {#if revokingId === tokenItem.id}
                                    <svg
                                        class="animate-spin h-3.5 w-3.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            class="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            stroke-width="4"
                                        ></circle>
                                        <path
                                            class="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                {:else}
                                    <Trash2 class="w-3.5 h-3.5" />
                                {/if}
                                Intrekken
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- New Token Display (shown once after create/refresh) -->
    {#if newTokenData && showNewTokenBanner}
        <div class="bg-white border-2 border-green-300 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-1.5 bg-green-100 rounded-lg">
                    <Check class="w-4 h-4 text-green-600" />
                </div>
                <h3 class="text-lg font-semibold font-aspekta text-green-900">
                    {#if tokens.length > 1}
                        Nieuw token gegenereerd
                    {:else}
                        Je token is klaar
                    {/if}
                </h3>
            </div>

            <!-- Info about what changed -->
            {#if tokens.length > 1}
                <div
                    class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                    <div class="flex items-start gap-2">
                        <ShieldAlert
                            class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                        />
                        <div class="text-sm text-amber-800 font-inter">
                            <p class="font-medium">
                                Let op: je vorige token is nu ongeldig.
                            </p>
                            <p class="mt-1">
                                Werk de token bij in al je MCP client
                                configuraties. Zonder update kan je AI-assistent
                                geen verbinding meer maken.
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <p class="text-sm text-zinc-600 mb-3 font-inter">
                Kopieer dit token nu. Het wordt na het sluiten van deze pagina
                niet meer getoond.
            </p>

            <!-- Token display -->
            <div
                class="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg mb-4"
            >
                <code
                    class="flex-1 text-sm font-mono text-zinc-700 break-all select-all"
                >
                    {newTokenVisible
                        ? newTokenData.token
                        : maskToken(newTokenData.token)}
                </code>
                <div class="flex items-center gap-1 shrink-0">
                    <button
                        onclick={() => (newTokenVisible = !newTokenVisible)}
                        class="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded"
                        title={newTokenVisible ? "Verberg token" : "Toon token"}
                    >
                        {#if newTokenVisible}
                            <EyeOff class="w-4 h-4" />
                        {:else}
                            <Eye class="w-4 h-4" />
                        {/if}
                    </button>
                    <button
                        onclick={() =>
                            copyToClipboard(newTokenData!.token, "new-token")}
                        class="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded"
                        title="Kopieer token"
                    >
                        {#if copiedSection === "new-token"}
                            <Check class="w-4 h-4 text-green-500" />
                        {:else}
                            <Copy class="w-4 h-4" />
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Quick update info -->
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start gap-2">
                    <Info class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div class="text-sm text-blue-800 font-inter">
                        <p class="font-medium">Werk je MCP configuratie bij:</p>
                        <ul class="mt-1.5 space-y-1 list-disc list-inside">
                            <li>
                                Vervang het oude token in je configuratiebestand
                            </li>
                            <li>
                                De URL blijft hetzelfde: <code
                                    class="font-mono text-xs bg-blue-100 px-1 rounded"
                                    >{connectionUrl}</code
                                >
                            </li>
                            <li>
                                Gebruik <button
                                    onclick={() =>
                                        copyToClipboard(
                                            newTokenData!.token,
                                            "new-token-inline",
                                        )}
                                    class="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                                    >dit token</button
                                >
                                als
                                <code
                                    class="font-mono text-xs bg-blue-100 px-1 rounded"
                                    >Authorization: Bearer &lt;token&gt;</code
                                >
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mt-4 flex justify-end">
                <button
                    onclick={() => {
                        showNewTokenBanner = false;
                    }}
                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-inter text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                    <X class="w-3.5 h-3.5" />
                    Sluiten
                </button>
            </div>
        </div>
    {/if}

    <!-- Refresh Confirmation Dialog -->
    {#if confirmRefreshId !== null}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            role="dialog"
            aria-modal="true"
        >
            <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-amber-100 rounded-lg">
                        <ShieldAlert class="w-5 h-5 text-amber-600" />
                    </div>
                    <h3
                        class="text-lg font-semibold font-aspekta text-zinc-900"
                    >
                        Token vernieuwen?
                    </h3>
                </div>

                <div class="space-y-3 text-sm text-zinc-600 font-inter mb-6">
                    <p>
                        Je staat op het punt om token <code
                            class="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700"
                            >{confirmRefreshPrefix}...</code
                        > te vernieuwen.
                    </p>

                    <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p class="text-red-800 font-medium">
                            Dit heeft directe gevolgen:
                        </p>
                        <ul
                            class="mt-1.5 space-y-1 text-red-700 list-disc list-inside"
                        >
                            <li>
                                Het oude token wordt <strong
                                    >onmiddellijk ongeldig</strong
                                >
                            </li>
                            <li>
                                Je AI-assistent kan geen taken meer aanmaken tot
                                je het nieuwe token configureert
                            </li>
                            <li>
                                Kopieer het nieuwe token direct na het
                                vernieuwen
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2">
                    <button
                        onclick={cancelRefresh}
                        disabled={refreshing}
                        class="px-4 py-2 text-sm font-inter text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                    <button
                        onclick={confirmRefreshToken}
                        disabled={refreshing}
                        class="flex items-center gap-1.5 px-4 py-2 text-sm font-inter text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if refreshing}
                            <svg
                                class="animate-spin h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Vernieuwen...
                        {:else}
                            <RefreshCw class="w-4 h-4" />
                            Ja, vernieuwen
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Connection URL -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
            <Terminal class="w-4 h-4 text-zinc-500" />
            <h3 class="text-lg font-semibold font-aspekta text-zinc-900">
                Verbindings-URL
            </h3>
        </div>

        <div
            class="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg"
        >
            <code class="flex-1 text-sm font-mono text-zinc-700 select-all">
                {connectionUrl}
            </code>
            <button
                onclick={() => copyToClipboard(connectionUrl, "url")}
                class="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded shrink-0"
                title="Kopieer URL"
            >
                {#if copiedSection === "url"}
                    <Check class="w-4 h-4 text-green-500" />
                {:else}
                    <Copy class="w-4 h-4" />
                {/if}
            </button>
        </div>
    </div>

    <!-- Client Configuratie (always visible) -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3
                    class="text-lg font-semibold font-aspekta text-zinc-900 mb-1"
                >
                    Client Configuratie
                </h3>
                {#if newTokenData}
                    <p class="text-sm text-zinc-600 font-inter">
                        Je nieuwe token is al ingevuld. Kopieer de configuratie
                        voor je MCP client.
                    </p>
                {:else}
                    <p class="text-sm text-zinc-600 font-inter">
                        Kopieer de configuratie voor je MCP client.
                    </p>
                {/if}
            </div>
            <button
                onclick={() =>
                    copyToClipboard(
                        clientConfigMap[configClientTab].config,
                        `config-${configClientTab}`,
                    )}
                class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-inter transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 shrink-0"
            >
                {#if copiedSection === `config-${configClientTab}`}
                    <Check class="w-3.5 h-3.5" />
                    Gekopieerd
                {:else}
                    <Copy class="w-3.5 h-3.5" />
                    Kopieer
                {/if}
            </button>
        </div>

        {#if configToken === "<JOUW_API_TOKEN>"}
            <div
                class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
                <div class="flex items-start gap-2">
                    <Info class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div class="text-sm text-amber-800 font-inter">
                        Vervang <code
                            class="font-mono text-xs bg-amber-100 px-1 rounded"
                            >&lt;JOUW_API_TOKEN&gt;</code
                        > met je echte API token.
                    </div>
                </div>
            </div>
        {/if}

        <!-- Client sub-tabs -->
        <div class="border-b border-zinc-200 mb-4">
            <nav class="-mb-px flex flex-wrap gap-x-3" aria-label="Client tabs">
                {#each clientTabs as tab}
                    <button
                        type="button"
                        onclick={() => (configClientTab = tab.id)}
                        class="whitespace-nowrap py-2.5 px-1 border-b-2 text-sm font-inter transition-colors"
                        class:border-blue-600={configClientTab === tab.id}
                        class:text-blue-600={configClientTab === tab.id}
                        class:border-transparent={configClientTab !== tab.id}
                        class:text-zinc-500={configClientTab !== tab.id}
                        class:hover:text-zinc-700={configClientTab !== tab.id}
                    >
                        {tab.label}
                    </button>
                {/each}
            </nav>
        </div>

        <!-- Active client config -->
        <div>
            <div class="mb-2">
                <code class="text-xs font-mono text-zinc-500"
                    >{clientConfigMap[configClientTab]?.file ?? ""}</code
                >
                <p class="text-xs text-zinc-400 font-inter mt-0.5">
                    {clientConfigMap[configClientTab]?.description ?? ""}
                </p>
            </div>
            <pre
                class="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">{clientConfigMap[
                    configClientTab
                ]?.config ?? ""}</pre>
        </div>
    </div>

    <!-- Available Tools -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold font-aspekta text-zinc-900 mb-4">
            Beschikbare Tools
        </h3>

        <div class="space-y-3">
            <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                <div class="flex items-center gap-2 mb-1">
                    <code class="text-sm font-mono font-semibold text-zinc-900"
                        >create_task</code
                    >
                </div>
                <p class="text-sm text-zinc-600 font-inter">
                    Maak een nieuwe taak aan in je Kees werkruimte. Je hoeft
                    alleen een titel op te geven — alle andere velden zijn
                    optioneel.
                </p>
                <div class="mt-3 space-y-1">
                    <p class="text-xs font-medium text-zinc-500 font-inter">
                        Vereist:
                    </p>
                    <code
                        class="inline-block px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs font-mono text-zinc-700"
                        >subject</code
                    >
                </div>
                <div class="mt-2 space-y-1">
                    <p class="text-xs font-medium text-zinc-500 font-inter">
                        Optioneel:
                    </p>
                    <div class="flex flex-wrap gap-1">
                        {#each ["priority", "deadline", "tags", "project_id", "voor_wie_is_het", "wat_ga_je_doen", "waarom_doe_je_het", "uren", "status"] as field}
                            <code
                                class="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs font-mono text-zinc-500"
                                >{field}</code
                            >
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Example -->
    <div class="bg-white border border-zinc-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold font-aspekta text-zinc-900 mb-4">
            Voorbeeld
        </h3>
        <p class="text-sm text-zinc-600 mb-4 font-inter">
            Zo kun je de AI-assistent vragen een taak aan te maken:
        </p>
        <div
            class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-inter italic"
        >
            "Maak een taak aan met als titel 'Review pull request' met hoge
            prioriteit en deadline volgende week vrijdag"
        </div>
        <p class="text-xs text-zinc-500 mt-3 font-inter">
            De AI-assistent gebruikt dan de <code class="font-mono"
                >create_task</code
            >
            tool om deze taak direct in je Kees account aan te maken.
        </p>
    </div>
</div>
