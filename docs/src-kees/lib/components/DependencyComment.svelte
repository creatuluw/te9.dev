<script lang="ts">
	import { AlertTriangle, Clock, User } from 'lucide-svelte';
	import Label from './Label.svelte';

	/**
	 * DependencyComment component props
	 *
	 * Displays dependency-related comments and notifications
	 */
	interface Props {
		/**
		 * The dependency change that triggered this comment
		 */
		dependencyChange: {
			changedTaskId: number;
			changedTaskName: string;
			changedField: 'deadline' | 'status' | 'owner_id';
			oldValue: any;
			newValue: any;
			changeTimestamp: string;
		};

		/**
		 * Whether this is displayed in a card or detailed view
		 */
		variant?: 'compact' | 'detailed';

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	let {
		dependencyChange,
		variant = 'compact',
		class: className = ''
	}: Props = $props();

	// Format the change description
	function formatChangeDescription(): string {
		switch (dependencyChange.changedField) {
			case 'deadline':
				const oldDate = dependencyChange.oldValue
					? new Date(dependencyChange.oldValue).toLocaleDateString('nl-NL')
					: 'geen';
				const newDate = dependencyChange.newValue
					? new Date(dependencyChange.newValue).toLocaleDateString('nl-NL')
					: 'geen';
				return `Deadline gewijzigd van ${oldDate} naar ${newDate}`;
			case 'status':
				return `Status gewijzigd van ${dependencyChange.oldValue} naar ${dependencyChange.newValue}`;
			case 'owner_id':
				return `Eigenaar gewijzigd`;
			default:
				return `Veld gewijzigd`;
		}
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString('nl-NL', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if variant === 'compact'}
	<!-- Compact version for card display -->
	<div class="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-sm {className}">
		<AlertTriangle size={14} class="text-orange-600 mt-0.5 flex-shrink-0" />
		<div class="flex-1 min-w-0">
			<p class="text-xs text-orange-800 font-medium">
				Afhankelijkheid: {dependencyChange.changedTaskName}
			</p>
			<p class="text-xs text-orange-700 mt-1">
				{formatChangeDescription()}
			</p>
		</div>
	</div>
{:else}
	<!-- Detailed version for full comment display -->
	<div class="bg-orange-50 border border-orange-200 rounded-lg p-4 {className}">
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
					<AlertTriangle size={16} class="text-orange-600" />
				</div>
			</div>

			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-sm font-medium text-orange-900">Afhankelijkheid gewijzigd</span>
					<Label variant="default" class="text-xs bg-orange-200 text-orange-800">
						Systeem
					</Label>
				</div>

				<p class="text-sm text-orange-800 mb-3">
					De taak <strong>{dependencyChange.changedTaskName}</strong> waar deze taak van afhangt is gewijzigd.
					Dit kan invloed hebben op uw planning en deadlines.
				</p>

				<div class="bg-white rounded border border-orange-300 p-3 mb-3">
					<div class="flex items-center gap-2 text-xs text-orange-700 mb-1">
						<Clock size={12} />
						<span>{formatChangeDescription()}</span>
					</div>
					<div class="flex items-center gap-2 text-xs text-orange-600">
						<User size={12} />
						<span>Systeem melding • {formatTimestamp(dependencyChange.changeTimestamp)}</span>
					</div>
				</div>

				<div class="flex gap-2">
					<button class="text-xs text-orange-700 hover:text-orange-900 underline">
						Case details bekijken
					</button>
					<button class="text-xs text-orange-700 hover:text-orange-900 underline">
						Taak bijwerken
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
