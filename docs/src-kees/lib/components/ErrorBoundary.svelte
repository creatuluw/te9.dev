<script lang="ts">
    import type { Snippet } from "svelte";
    import type { AppError } from "$lib/types/errors";
    import {
        AppError as AppErrorClass,
        getUserMessage,
        NotFoundError,
        ValidationError,
        NetworkError,
    } from "$lib/types/errors";
    import Button from "./Button.svelte";

    /**
     * ErrorBoundary component props
     *
     * Component for displaying errors with user-friendly messages and recovery options.
     */
    interface Props {
        /**
         * Error to display (can be AppError, Error, or unknown)
         * @example
         * ```typescript
         * <ErrorBoundary error={someError} />
         * ```
         */
        error?: AppError | Error | unknown;

        /**
         * Custom reset handler (defaults to page reload)
         * @example
         * ```typescript
         * <ErrorBoundary
         *   error={error}
         *   reset={() => { error = null; retry(); }}
         * />
         * ```
         */
        reset?: () => void;

        /**
         * Custom fallback render function for Error types
         * @param error - The error to render
         * @example
         * ```typescript
         * <ErrorBoundary
         *   error={error}
         *   fallback={(err) => <CustomErrorDisplay error={err} />}
         * />
         * ```
         */
        fallback?: Snippet<[AppError | Error]>;

        /**
         * Additional CSS classes
         */
        class?: string;
    }

    let { error, reset, fallback, class: className = "" }: Props = $props();

    let appError: AppError | null = $state(null);

    // Convert unknown error to AppError
    $effect(() => {
        if (error) {
            if (error instanceof Error && "code" in error) {
                appError = error as AppError;
            } else if (error instanceof Error) {
                appError = AppErrorClass.from(error);
            } else {
                appError = AppErrorClass.from(error);
            }
        }
    });

    function handleReset() {
        if (reset) {
            reset();
        } else {
            window.location.reload();
        }
    }

    function getErrorDetails(error: AppError): string {
        if (error instanceof NotFoundError) {
            return "De gevraagde bron kon niet worden gevonden.";
        }
        if (error instanceof ValidationError) {
            return "Er is een validatiefout opgetreden. Controleer uw invoer.";
        }
        if (error instanceof NetworkError) {
            return "Er is een netwerkfout opgetreden. Controleer uw verbinding.";
        }
        return "Er is een onverwachte fout opgetreden.";
    }
</script>

{#if appError}
    <div
        class="flex items-center justify-center min-h-screen bg-zinc-50 {className}"
    >
        <div
            class="max-w-md w-full bg-white rounded-lg shadow-sm border border-zinc-200 p-8"
        >
            <div class="text-center">
                <!-- Error Icon -->
                <div
                    class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
                >
                    <svg
                        class="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <!-- Error Title -->
                <h2 class="text-xl font-semibold text-zinc-900 mb-2">
                    Er is een fout opgetreden
                </h2>

                <!-- Error Message -->
                <p class="text-zinc-600 mb-4">{getUserMessage(appError)}</p>

                <!-- Error Details (only in development) -->
                {#if import.meta.env.DEV && appError.message}
                    <div
                        class="bg-zinc-50 border border-zinc-200 rounded-md p-4 mb-4 text-left"
                    >
                        <p class="text-sm font-medium text-zinc-900 mb-1">
                            Technische details:
                        </p>
                        <p class="text-xs text-zinc-600 font-mono break-all">
                            {appError.message}
                        </p>
                        {#if appError.stack}
                            <details class="mt-2">
                                <summary
                                    class="text-xs text-zinc-500 cursor-pointer"
                                    >Stack trace</summary
                                >
                                <pre
                                    class="text-xs text-zinc-600 mt-2 overflow-auto">{appError.stack}</pre>
                            </details>
                        {/if}
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-3 justify-center">
                    <Button onclick={handleReset}>Probeer opnieuw</Button>
                    <Button
                        variant="secondary"
                        onclick={() => (window.location.href = "/")}
                    >
                        Ga naar home
                    </Button>
                </div>
            </div>
        </div>
    </div>
{:else if fallback && error instanceof Error}
    {@render fallback(error)}
{/if}
