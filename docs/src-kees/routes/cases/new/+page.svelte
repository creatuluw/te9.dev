<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import * as processService from "$lib/services/processService";
    import * as caseService from "$lib/services/caseService";
    import type { Process } from "$lib/services/processService";
    import Button from "$lib/components/Button.svelte";
    import UserSelector from "$lib/components/UserSelector.svelte";
    import Select, { type SelectOption } from "$lib/components/Select.svelte";
    import Spinner from "$lib/components/Spinner.svelte";

    let processes: Process[] = $state([]);
    let selectedProcessId: number | null = $state(null);
    let caseName = $state("");
    let startDate = $state(new Date().toISOString().split("T")[0]);
    let ownerId: string | null = $state(null);
    let loading = $state(false);
    let processDetails: { stepCount: number; taskCount: number } | null =
        $state(null);

    // Convert processes to SelectOption format
    const processOptions = $derived.by((): SelectOption[] => {
        return processes.map((process) => ({
            value: process.id.toString(),
            label: process.name,
        }));
    });

    onMount(async () => {
        try {
            const processesResult = await processService.getAllProcesses();
            if (processesResult.success) {
                processes = processesResult.value;
            }

            // Check if processId is in URL params
            const processIdParam = $page.url.searchParams.get("processId");
            if (processIdParam) {
                const processId = parseInt(processIdParam, 10);
                if (!isNaN(processId)) {
                    selectedProcessId = processId;
                    await loadProcessDetails(processId);
                }
            }
        } catch (error) {
            console.error("Error loading processes:", error);
        }
    });

    async function loadProcessDetails(processId: number) {
        try {
            const statsResult = await processService.getProcessStats(processId);
            if (statsResult.success) {
                processDetails = statsResult.value;
            }
        } catch (error) {
            console.error("Error loading process details:", error);
        }
    }

    function handleProcessChange(value: string | string[] | null) {
        if (typeof value !== "string") return;
        selectedProcessId = value ? parseInt(value) : null;
        if (selectedProcessId) {
            loadProcessDetails(selectedProcessId);
        } else {
            processDetails = null;
        }
    }

    async function handleSubmit() {
        if (!selectedProcessId || !caseName.trim()) {
            alert("Selecteer een proces en voer een casenaam in");
            return;
        }
        loading = true;
        const processResult =
            await processService.getProcessById(selectedProcessId);
        if (!processResult.success) {
            console.error("Error loading process:", processResult.error);
            alert("Fout bij laden van proces");
            loading = false;
            return;
        }

        // Capture the current URL as the source
        const sourceUrl =
            typeof window !== "undefined" ? window.location.href : null;

        const createCaseResult = await caseService.createCaseFromProcess(
            {
                ...processResult.value.process,
                steps: processResult.value.steps,
            },
            {
                name: caseName.trim(),
                start_date: startDate,
                owner_id: ownerId || undefined,
                process_id: selectedProcessId,
                source: sourceUrl || undefined,
            },
        );

        if (!createCaseResult.success) {
            console.error("Error creating case:", createCaseResult.error);
            alert("Fout bij aanmaken van case");
            loading = false;
            return;
        }

        // Navigate to the newly created case (loading will persist during navigation)
        await goto(`/cases/${createCaseResult.value.id}`);
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold text-zinc-900 mb-8">Nieuwe Case Aanmaken</h1>

    <form
        onsubmit={handleSubmit}
        class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6"
    >
        <div class="mb-6">
            <label
                for="process"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Processjabloon <span class="text-red-500">*</span>
            </label>
            <Select
                value={selectedProcessId?.toString() || null}
                options={processOptions}
                placeholder="Selecteer een processjabloon..."
                onchange={handleProcessChange}
                class="w-full"
            />
            <p class="text-sm text-zinc-500 mt-2">
                Selecteer een processjabloon. Bij het aanmaken van een case
                worden automatisch alle stappen en taken van het sjabloon
                opgenomen, met deadlines berekend vanaf de startdatum.
            </p>
            {#if processDetails && selectedProcessId}
                <div
                    class="mt-3 p-3 bg-zinc-50 rounded-sm border border-zinc-200"
                >
                    <p class="text-sm text-zinc-600">
                        Dit sjabloon bevat <strong
                            >{processDetails.stepCount} stap{processDetails.stepCount !==
                            1
                                ? "pen"
                                : ""}</strong
                        >
                        en
                        <strong
                            >{processDetails.taskCount} taak{processDetails.taskCount !==
                            1
                                ? "en"
                                : ""}</strong
                        > die voor deze case worden aangemaakt.
                    </p>
                </div>
            {/if}
        </div>

        <div class="mb-6">
            <label
                for="caseName"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Casenaam <span class="text-red-500">*</span>
            </label>
            <input
                id="caseName"
                type="text"
                bind:value={caseName}
                required
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="bijv. Onboarding voor Jan Jansen"
            />
        </div>

        <div class="mb-6">
            <label
                for="startDate"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Startdatum <span class="text-red-500">*</span>
            </label>
            <input
                id="startDate"
                type="date"
                bind:value={startDate}
                required
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
        </div>

        <div class="mb-6">
            <label
                for="owner"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Case Eigenaar
            </label>
            <UserSelector
                bind:selectedUserId={ownerId}
                placeholder="Case eigenaar toewijzen (optioneel)..."
                class="w-full"
            />
        </div>

        <div class="flex gap-3">
            <Button type="submit" disabled={loading}>
                {#if loading}
                    <Spinner size="sm" />
                {:else}
                    Case Aanmaken
                {/if}
            </Button>
            <Button
                variant="secondary"
                type="button"
                onclick={() => goto("/cases")}>Annuleren</Button
            >
        </div>
    </form>
</div>
