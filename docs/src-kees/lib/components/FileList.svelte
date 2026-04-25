<script lang="ts">
	import { File, ExternalLink, Trash2 } from 'lucide-svelte';
	import IconButton from './IconButton.svelte';
	import type { ComponentType } from 'svelte';

	/**
	 * FileList component props
	 * 
	 * Displays a list of files in a table format with name, type, and actions.
	 */
	interface Props {
		/**
		 * Array of file URLs or file objects
		 */
		files: string[] | FileItem[];

		/**
		 * Optional title/label to display above the file list
		 */
		title?: string;

		/**
		 * Whether to show delete action button
		 * @default false
		 */
		showDelete?: boolean;

		/**
		 * Callback when a file is opened/clicked
		 */
		onopen?: (url: string, file?: FileItem) => void;

		/**
		 * Callback when a file is deleted (only shown if showDelete is true)
		 */
		ondelete?: (url: string, file?: FileItem) => void;

		/**
		 * Whether delete action is disabled
		 * @default false
		 */
		deleteDisabled?: boolean;

		/**
		 * Additional CSS classes
		 */
		class?: string;
	}

	/**
	 * File item interface for extended file information
	 */
	export interface FileItem {
		url: string;
		name?: string;
		size?: number;
		type?: string;
	}

	let {
		files,
		title,
		showDelete = false,
		onopen,
		ondelete,
		deleteDisabled = false,
		class: className = ''
	}: Props = $props();

	/**
	 * Extract filename from URL
	 */
	function getFileNameFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			const pathParts = urlObj.pathname.split('/');
			const filename = pathParts[pathParts.length - 1] || 'Bestand';
			return decodeURIComponent(filename);
		} catch {
			const match = url.match(/([^/]+)(?:\?|$)/);
			if (match) {
				try {
					return decodeURIComponent(match[1]);
				} catch {
					return match[1];
				}
			}
			return 'Bestand';
		}
	}

	/**
	 * Get file extension from filename
	 */
	function getFileExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '-';
	}

	/**
	 * Format file size in bytes to human-readable format
	 */
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
	}

	/**
	 * Handle file open
	 */
	function handleOpen(url: string, file?: FileItem) {
		if (onopen) {
			onopen(url, file);
		} else {
			window.open(url, '_blank');
		}
	}

	/**
	 * Handle file delete
	 */
	function handleDelete(url: string, file?: FileItem) {
		if (ondelete && !deleteDisabled) {
			ondelete(url, file);
		}
	}

	// Normalize files to FileItem array
	const normalizedFiles = $derived.by(() => {
		return files.map((file): FileItem => {
			if (typeof file === 'string') {
				return { url: file };
			}
			return file;
		});
	});

	// Get display name for file
	const getDisplayName = (file: FileItem): string => {
		return file.name || getFileNameFromUrl(file.url);
	};

	// Get file type/extension
	const getFileType = (file: FileItem): string => {
		if (file.type) return file.type;
		const filename = getDisplayName(file);
		return getFileExtension(filename);
	};
</script>

{#if normalizedFiles.length > 0}
	<div class={className}>
		{#if title}
			<p class="text-sm font-medium text-zinc-900 mb-3 font-aspekta">{title}</p>
		{/if}
		<div class="border border-zinc-200 rounded-lg overflow-hidden">
			<table class="min-w-full divide-y divide-zinc-200">
				<thead class="bg-zinc-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta">
							Naam
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta">
							Type
						</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-zinc-900 uppercase tracking-wider font-aspekta">
							Acties
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-zinc-200">
					{#each normalizedFiles as file (file.url)}
						<tr class="hover:bg-zinc-50">
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<File class="w-5 h-5 text-zinc-400" />
									<button
										onclick={() => handleOpen(file.url, file)}
										class="text-sm font-medium text-blue-600 hover:text-blue-800 font-inter"
										title="Bestand openen"
									>
										{getDisplayName(file)}
									</button>
								</div>
							</td>
							<td class="px-4 py-3 text-sm text-zinc-600 font-inter">
								{getFileType(file)}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									<IconButton
										icon={ExternalLink}
										variant="ghost"
										size="sm"
										onclick={() => handleOpen(file.url, file)}
										tooltip="Bestand openen"
									/>
									{#if showDelete}
										<IconButton
											icon={Trash2}
											variant="ghost"
											size="sm"
											onclick={() => handleDelete(file.url, file)}
											tooltip="Bestand verwijderen"
											disabled={deleteDisabled}
										/>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}




























