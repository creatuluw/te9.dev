<script lang="ts">
    import { goto } from "$app/navigation";
    import * as processService from "$lib/services/processService";
    import Button from "$lib/components/Button.svelte";
    import Spinner from "$lib/components/Spinner.svelte";

    let name = $state("");
    let description = $state("");
    let completionDays = $state(30);
    let loading = $state(false);

    async function handleSubmit(event: Event) {
        event.preventDefault();
        if (!name.trim()) {
            alert("Voer een procesnaam in");
            return;
        }
        loading = true;
        try {
            const result = await processService.createProcess({
                name: name.trim(),
                description: description.trim() || undefined,
                completion_days: completionDays,
            });
            if (result.success) {
                goto(`/processes/${result.value.id}`);
            } else {
                console.error("Error creating process:", result.error);
                alert("Fout bij aanmaken van proces");
                loading = false;
            }
        } catch (error) {
            console.error("Error creating process:", error);
            alert("Fout bij aanmaken van proces");
            loading = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold text-zinc-900 mb-2">Process maken</h1>
    <p class="text-zinc-600 mb-8">
        Maak een herbruikbaar proces. Na het definiëren van stappen en taken kun
        je dit sjabloon gebruiken om case-tijdlijnen automatisch te genereren.
    </p>

    <form
        onsubmit={handleSubmit}
        class="bg-white rounded-lg shadow-xs border border-zinc-200 p-6"
    >
        <div class="mb-6">
            <label
                for="name"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Procesnaam <span class="text-red-500">*</span>
            </label>
            <input
                id="name"
                type="text"
                bind:value={name}
                required
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="Bijv. Verjaardag medewerker "
            />
        </div>

        <div class="mb-6">
            <label
                for="description"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Beschrijving
            </label>
            <textarea
                id="description"
                bind:value={description}
                rows="4"
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="Beschrijf waar dit proces voor is..."
            />
        </div>

        <div class="mb-6">
            <label
                for="completionDays"
                class="block text-sm font-medium text-zinc-900 mb-2"
            >
                Maximale duur in dagen <span class="text-red-500">*</span>
            </label>
            <input
                id="completionDays"
                type="number"
                bind:value={completionDays}
                min="1"
                required
                class="w-full px-3 py-2 border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
        </div>

        <div class="flex gap-3">
            <Button type="submit" disabled={loading}>
                {#if loading}
                    <Spinner size="sm" />
                {:else}
                    Proces Aanmaken
                {/if}
            </Button>
            <Button
                variant="secondary"
                type="button"
                onclick={() => goto("/processes")}
            >
                Annuleren
            </Button>
        </div>
    </form>
</div>
