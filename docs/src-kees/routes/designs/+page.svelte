<script lang="ts">
	import { Tabs } from '$lib/components';
	import Architecture from './Architecture.svelte';
	import ERD from './ERD.svelte';
	import type { TabItem } from '$lib/components/Tabs.svelte';

	const tabs: TabItem[] = [
		{ id: 'architecture', label: 'Architecture' },
		{ id: 'database', label: 'Database' }
	];
</script>

<div class="container mx-auto px-8 py-12 max-w-7xl">
	<div class="space-y-6 mb-8">
		<h1 class="text-3xl font-semibold text-zinc-900 font-aspekta">System Designs</h1>
		<p class="text-zinc-600">
			Visual documentation of the system architecture and database schema.
		</p>
	</div>

	<div class="border border-zinc-200 rounded-lg bg-white">
		<Tabs {tabs} defaultTab="architecture" class="p-6">
			{#snippet children({ activeTab })}
				{#if activeTab === 'architecture'}
					<div class="space-y-4">
						<div class="mb-4">
							<h2 class="text-xl font-semibold text-zinc-900 font-aspekta mb-2">
								System Architecture
							</h2>
							<p class="text-sm text-zinc-600">
								Interactive architecture diagram showing the layered architecture with flow from presentation layer through services to data access and external systems.
							</p>
						</div>
						<div class="border border-zinc-200 rounded-lg p-4 bg-zinc-50 overflow-hidden">
							<Architecture />
						</div>
						<div class="mt-4 text-sm text-zinc-600 space-y-2">
							<h3 class="font-medium text-zinc-900">Architecture Layers:</h3>
							<ul class="list-disc list-inside space-y-1 ml-4">
								<li><strong>Presentation Layer:</strong> SvelteKit routes and UI components</li>
								<li><strong>Service Layer:</strong> Business logic and orchestration</li>
								<li><strong>Data Access Layer:</strong> PostgREST client and API utilities</li>
								<li><strong>External Services:</strong> PocketBase for authentication, Email service for notifications</li>
								<li><strong>Database:</strong> PostgreSQL accessed via PostgREST REST API</li>
							</ul>
						</div>
					</div>
				{:else if activeTab === 'database'}
					<div class="space-y-4">
						<div class="mb-4">
							<h2 class="text-xl font-semibold text-zinc-900 font-aspekta mb-2">
								Entity-Relationship Diagram (ERD)
							</h2>
							<p class="text-sm text-zinc-600">
								Interactive Entity-Relationship Diagram showing all database tables, their attributes, data types, primary keys (PK), foreign keys (FK), and relationships with cardinality. The schema uses a process template pattern where templates define reusable workflows that generate executable cases.
							</p>
						</div>
						<div class="border border-zinc-200 rounded-lg p-4 bg-zinc-50 overflow-hidden">
							<ERD />
						</div>
						<div class="mt-4 text-sm text-zinc-600 space-y-4">
							<div>
								<h3 class="font-medium text-zinc-900 mb-2">Table Groups:</h3>
								<ul class="list-disc list-inside space-y-1 ml-4">
									<li><strong>Process Templates:</strong> Reusable workflow definitions (processes → steps → tasks)</li>
									<li><strong>Case Execution:</strong> Active instances of processes with tracked status and deadlines</li>
									<li><strong>Supporting Tables:</strong> Notifications and audit logs for task completion</li>
								</ul>
							</div>
							<div>
								<h3 class="font-medium text-zinc-900 mb-2">Key Relationships:</h3>
								<ul class="list-disc list-inside space-y-1 ml-4">
									<li>One process can have multiple steps (1:N)</li>
									<li>One step can have multiple tasks (1:N)</li>
									<li>One process can generate multiple cases (1:N)</li>
									<li>One case tracks multiple step instances (1:N)</li>
									<li>One step instance tracks multiple task instances (1:N)</li>
									<li>Task logs reference tasks and cases for audit trail</li>
								</ul>
							</div>
							<div>
								<h3 class="font-medium text-zinc-900 mb-2">Notes:</h3>
								<ul class="list-disc list-inside space-y-1 ml-4">
									<li>All tables use the <code class="px-1 py-0.5 bg-zinc-200 rounded text-xs">_bpm_</code> prefix for namespacing</li>
									<li>Owner IDs are stored as VARCHAR(255) to accommodate PocketBase user IDs</li>
									<li>Foreign keys use ON DELETE CASCADE for execution tables and ON DELETE RESTRICT for template references</li>
									<li>Task logs provide complete audit trail of task completions</li>
									<li>Use the zoom and pan controls to explore the diagram interactively</li>
								</ul>
							</div>
						</div>
					</div>
				{/if}
			{/snippet}
		</Tabs>
	</div>
</div>
