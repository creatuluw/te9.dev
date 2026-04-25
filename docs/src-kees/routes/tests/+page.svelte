<script lang="ts">
    import { onMount } from "svelte";
    import Button from "$lib/components/Button.svelte";
    import { toastStore } from "$lib/stores/toastStore";
    import * as emailService from "$lib/services/emailService";
    import Card from "$lib/components/Card.svelte";
    import IconButton from "$lib/components/IconButton.svelte";
    import Spinner from "$lib/components/Spinner.svelte";
    import {
        Clock,
        CheckCircle2,
        AlertCircle,
        Pencil,
        Trash2,
    } from "lucide-svelte";

    let emailAddress = $state("");
    let message = $state<{ type: "success" | "error"; text: string } | null>(
        null,
    );
    let loading = $state(false);
    let tokenConfigured = $state(false);
    let configStatus = $state<{ token: boolean; url: boolean } | null>(null);

    onMount(() => {
        // Check if email service token is configured
        const token = import.meta.env.PUBLIC_EMAIL_SERVICE_TOKEN;
        const url = import.meta.env.PUBLIC_EMAIL_SERVICE_URL;

        tokenConfigured = !!token && token.trim().length > 0;
        configStatus = {
            token: tokenConfigured,
            url: !!url && url.trim().length > 0,
        };

        // Debug logging
        console.log("📋 Email Service Configuration Check:", {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            tokenConfigured,
            urlExists: !!url,
            urlValue: url,
            allEnvKeys: Object.keys(import.meta.env).filter((k) =>
                k.includes("EMAIL"),
            ),
        });

        if (!tokenConfigured) {
            console.warn("⚠️ EMAIL_SERVICE_TOKEN not configured");
            console.warn(
                "⚠️ If you have set PUBLIC_EMAIL_SERVICE_TOKEN in .env, restart your dev server!",
            );
        }
    });

    async function sendTestEmail() {
        console.log("📧 Starting email test...");
        console.log("📧 Email address:", emailAddress);

        if (!emailAddress.trim()) {
            const errorMsg = "Please enter an email address";
            console.warn("⚠️ Validation failed:", errorMsg);
            message = { type: "error", text: errorMsg };
            toastStore.add(errorMsg, "error");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailAddress)) {
            const errorMsg = "Please enter a valid email address";
            console.warn("⚠️ Email validation failed:", emailAddress);
            message = { type: "error", text: errorMsg };
            toastStore.add(errorMsg, "error");
            return;
        }
        message = null;
        loading = true;
        console.log("⏳ Sending test email to:", emailAddress);

        try {
            const startTime = Date.now();
            console.log("📤 Calling email service...");

            const result = await emailService.sendTestEmail(emailAddress);

            const duration = Date.now() - startTime;
            console.log("✅ Email service responded:", {
                success: result.success,
                duration: `${duration}ms`,
                data: result.success ? result.value : undefined,
                error: result.success ? undefined : result.error,
            });

            if (result.success) {
                const successMsg = `Test email sent successfully to ${emailAddress}!`;
                console.log("✅ Email sent successfully");
                console.log("📧 Message ID:", result.value?.data?.messageId);
                console.log("📧 Status:", result.value?.data?.status);

                message = {
                    type: "success",
                    text: successMsg,
                };
                toastStore.add(successMsg, "success", 5000);
                emailAddress = "";
            } else {
                const errorMsg =
                    (result.error as any)?.message ||
                    "Failed to send test email";
                console.error("❌ Email sending failed:", {
                    error: result.error,
                });

                message = {
                    type: "error",
                    text: errorMsg,
                };
                toastStore.add(errorMsg, "error", 5000);
            }
        } catch (error) {
            console.error(
                "❌ Exception occurred while sending test email:",
                error,
            );
            console.error("❌ Error details:", {
                message:
                    error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });

            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            message = {
                type: "error",
                text: errorMsg,
            };
            toastStore.add(errorMsg, "error", 7000);
        } finally {
            loading = false;
            console.log("🏁 Email test completed");
        }
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    <h1 class="text-3xl font-bold text-zinc-900 mb-8">Tests</h1>

    <!-- Card Component Showcase -->
    <div class="mb-12">
        <h2 class="text-2xl font-semibold text-zinc-900 mb-6">
            Card Component Showcase
        </h2>

        <!-- Stat Cards -->
        <h3 class="text-lg font-medium text-zinc-900 mb-4">
            Dashboard Stat Cards
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card
                icon={Clock}
                iconVariant="default"
                hover={true}
                onclick={() => toastStore.add("Pending clicked", "info")}
            >
                {#snippet children()}
                    <div class="mb-3">
                        <div class="text-sm text-zinc-600 mb-1">
                            In afwachting
                        </div>
                        <div class="text-2xl font-bold text-zinc-900">12</div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die wachten om te starten
                    </p>
                {/snippet}
            </Card>

            <Card
                icon={CheckCircle2}
                iconVariant="success"
                hover={true}
                onclick={() => toastStore.add("Completed clicked", "success")}
            >
                {#snippet children()}
                    <div class="mb-3">
                        <div class="text-sm text-green-600 mb-1">Voltooid</div>
                        <div class="text-2xl font-bold text-green-900">28</div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die succesvol zijn afgerond
                    </p>
                {/snippet}
            </Card>

            <Card
                icon={AlertCircle}
                iconVariant="danger"
                hover={true}
                onclick={() => toastStore.add("Overdue clicked", "error")}
            >
                {#snippet children()}
                    <div class="mb-3">
                        <div class="text-sm text-red-600 mb-1">Te laat</div>
                        <div class="text-2xl font-bold text-red-900">3</div>
                    </div>
                    <p
                        class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                    >
                        Cases die de deadline hebben overschreden
                    </p>
                {/snippet}
            </Card>
        </div>

        <!-- Complex Cards -->
        <h3 class="text-lg font-medium text-zinc-900 mb-4">
            Case & Process Cards
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card
                showHeader={true}
                showFooter={true}
                hover={true}
                onclick={() => toastStore.add("Case card clicked", "info")}
            >
                {#snippet header()}
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <h3
                            class="text-lg font-semibold text-zinc-900 tracking-tight leading-tight"
                        >
                            Example Case
                        </h3>
                        <span
                            class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-800"
                        >
                            Actief
                        </span>
                    </div>
                    <div class="text-sm text-zinc-600">Business Process</div>
                {/snippet}
                {#snippet children()}
                    <div class="space-y-3">
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-zinc-500 min-w-[70px]"
                                >Gestart</span
                            >
                            <span class="text-zinc-900 font-medium"
                                >30 Oct 2025</span
                            >
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-zinc-500 min-w-[70px]"
                                >Deadline</span
                            >
                            <span class="text-zinc-900 font-medium"
                                >15 Nov 2025</span
                            >
                        </div>
                    </div>
                {/snippet}
                {#snippet footer()}
                    <span class="text-sm text-zinc-600"
                        >Toegewezen aan Case Owner</span
                    >
                {/snippet}
            </Card>

            <Card showFooter={true}>
                {#snippet children()}
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-semibold text-zinc-900">
                            Process Example
                        </h3>
                        <div
                            class="text-sm text-zinc-500 flex flex-col items-end gap-0.5"
                        >
                            <span>5 active</span>
                            <span class="text-zinc-400">10 voltooide</span>
                        </div>
                    </div>
                    <p class="text-zinc-600 text-sm mb-4 line-clamp-2">
                        This is an example process with multiple steps and
                        tasks.
                    </p>
                    <div class="text-sm text-zinc-500 space-y-1">
                        <div>Voltooiing: 30 dagen</div>
                        <div class="flex gap-4">
                            <span>5 stappen</span>
                            <span>12 taken</span>
                        </div>
                    </div>
                {/snippet}
                {#snippet footer()}
                    <div class="flex gap-2 justify-end items-center">
                        <IconButton
                            icon={Pencil}
                            onclick={() =>
                                toastStore.add("Edit clicked", "info")}
                        />
                        <IconButton
                            icon={Trash2}
                            onclick={() =>
                                toastStore.add("Delete clicked", "error")}
                        />
                    </div>
                {/snippet}
            </Card>

            <Card variant="info">
                {#snippet children()}
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span
                                    class="text-xs font-medium text-zinc-500 uppercase"
                                    >NOTIFICATION</span
                                >
                                <span
                                    class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    Nieuw
                                </span>
                            </div>
                            <h3
                                class="text-lg font-semibold text-zinc-900 mb-1"
                            >
                                New notification
                            </h3>
                            <p class="text-zinc-600 mb-2">
                                You have a new unread notification
                            </p>
                            <div class="text-xs text-zinc-500">Just now</div>
                        </div>
                    </div>
                {/snippet}
            </Card>
        </div>
    </div>

    <div class="max-w-2xl">
        <!-- Email Testing Card -->
        <div class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6">
            <h2 class="text-xl font-semibold text-zinc-900 mb-4">
                Email Testing
            </h2>
            <p class="text-zinc-600 mb-6 text-sm">
                Send a test email to verify the email service is working
                correctly.
            </p>

            {#if configStatus}
                <div
                    class="mb-6 p-4 rounded-md bg-zinc-50 border border-zinc-200"
                >
                    <h3 class="text-sm font-semibold text-zinc-900 mb-2">
                        Configuration Status
                    </h3>
                    <div class="space-y-1 text-sm">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-zinc-700"
                                >Service Token:</span
                            >
                            {#if configStatus.token}
                                <span class="text-green-600 font-medium"
                                    >✓ Configured</span
                                >
                            {:else}
                                <span class="text-red-600 font-medium"
                                    >✗ Not Configured</span
                                >
                            {/if}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-zinc-700"
                                >Service URL:</span
                            >
                            {#if configStatus.url}
                                <span class="text-green-600 font-medium"
                                    >✓ Configured</span
                                >
                            {:else}
                                <span class="text-yellow-600 font-medium"
                                    >⚠ Using Default</span
                                >
                            {/if}
                        </div>
                    </div>

                    {#if !configStatus.token}
                        <div
                            class="mt-3 p-3 rounded-md bg-red-50 border border-red-200"
                        >
                            <p class="text-sm font-medium text-red-800 mb-1">
                                EMAIL_SERVICE_TOKEN is not configured
                            </p>
                            <div class="text-xs text-red-700 space-y-1">
                                <p>
                                    Please set <code
                                        class="font-mono bg-red-100 px-1 py-0.5 rounded"
                                        >PUBLIC_EMAIL_SERVICE_TOKEN</code
                                    >
                                    in your
                                    <code
                                        class="font-mono bg-red-100 px-1 py-0.5 rounded"
                                        >.env</code
                                    > file.
                                </p>
                                <p class="font-semibold">
                                    ⚠️ Important: You must restart your
                                    development server after adding or changing
                                    environment variables in <code
                                        class="font-mono bg-red-100 px-1 py-0.5 rounded"
                                        >.env</code
                                    >.
                                </p>
                                <p class="text-zinc-600 mt-2">
                                    Check the browser console for detailed
                                    debugging information.
                                </p>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}

            <div class="space-y-4">
                <div>
                    <label
                        for="email-input"
                        class="block text-sm font-medium text-zinc-700 mb-2"
                    >
                        Email Address
                    </label>
                    <input
                        id="email-input"
                        type="email"
                        bind:value={emailAddress}
                        placeholder="test@example.com"
                        disabled={loading}
                        class="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                        onkeydown={(e) => {
                            if (e.key === "Enter" && !loading) {
                                sendTestEmail();
                            }
                        }}
                    />
                </div>

                <Button
                    onclick={sendTestEmail}
                    disabled={loading || !tokenConfigured}
                >
                    {#if loading}
                        <Spinner size="sm" />
                    {:else}
                        Send Test Email
                    {/if}
                </Button>

                {#if message}
                    <div
                        class="p-4 rounded-md {message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'}"
                    >
                        <p
                            class="text-sm {message.type === 'success'
                                ? 'text-green-800'
                                : 'text-red-800'}"
                        >
                            {message.text}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
