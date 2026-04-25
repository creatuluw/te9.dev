<script lang="ts">
	import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface FileTreeNode {
		name: string;
		path: string;
		type: 'file' | 'directory';
		children?: FileTreeNode[];
		description?: string;
		detailedDescription?: string;
	}

	let expandedRows = $state<Set<string>>(new Set());
	let expandedDetails = $state<Set<string>>(new Set());

	function toggleRow(path: string) {
		if (expandedRows.has(path)) {
			expandedRows.delete(path);
		} else {
			expandedRows.add(path);
		}
		expandedRows = new Set(expandedRows);
	}

	function toggleDetails(path: string) {
		if (expandedDetails.has(path)) {
			expandedDetails.delete(path);
		} else {
			expandedDetails.add(path);
		}
		expandedDetails = new Set(expandedDetails);
	}

	function isExpanded(path: string): boolean {
		return expandedRows.has(path);
	}

	function isDetailsExpanded(path: string): boolean {
		return expandedDetails.has(path);
	}

	// Flatten tree for table display with indentation levels
	function flattenTree(nodes: FileTreeNode[], level: number = 0, parentPath: string = ''): Array<FileTreeNode & { level: number; fullPath: string }> {
		const result: Array<FileTreeNode & { level: number; fullPath: string }> = [];
		
		for (const node of nodes) {
			const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
			result.push({
				...node,
				level,
				fullPath
			});
			
			if (node.type === 'directory' && node.children && isExpanded(node.path)) {
				result.push(...flattenTree(node.children, level + 1, fullPath));
			}
		}
		
		return result;
	}

	const flattenedTree = $derived.by(() => flattenTree(data.tree));
</script>

<svelte:head>
	<title>File Tree - Documentation</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-zinc-900 mb-2">Source Code File Tree</h1>
		<p class="text-zinc-600">Complete directory structure of the src folder with descriptions of each file and folder's purpose.</p>
	</div>

	<div class="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-zinc-50 border-b border-zinc-200">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Name</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Type</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Description</th>
						<th class="px-6 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider w-24">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-100">
					{#each flattenedTree as node (node.path)}
						<tr class="hover:bg-zinc-50/50 transition-colors">
							<td class="px-6 py-4">
								<div class="flex items-center gap-2" style="padding-left: {node.level * 1.5}rem">
									{#if node.type === 'directory'}
										<button
											type="button"
											onclick={() => toggleRow(node.path)}
											class="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-zinc-700 transition-colors"
										>
											{#if isExpanded(node.path)}
												<ChevronDown size={16} class="text-zinc-500" />
												<FolderOpen size={16} class="text-zinc-500" />
											{:else}
												<ChevronRight size={16} class="text-zinc-500" />
												<Folder size={16} class="text-zinc-500" />
											{/if}
											<span>{node.name}</span>
										</button>
									{:else}
										<div class="flex items-center gap-2 text-sm text-zinc-700">
											<File size={16} class="text-zinc-400" />
											<span>{node.name}</span>
										</div>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
									node.type === 'directory' 
										? 'bg-blue-100 text-blue-800' 
										: 'bg-zinc-100 text-zinc-800'
								}">
									{node.type === 'directory' ? 'Directory' : 'File'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-zinc-600">
								{node.description || 'No description available'}
							</td>
							<td class="px-6 py-4 text-center">
								<button
									type="button"
									onclick={() => toggleDetails(node.path)}
									class="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-700"
									aria-label={isDetailsExpanded(node.path) ? 'Hide details' : 'Show details'}
									aria-expanded={isDetailsExpanded(node.path)}
								>
									<ChevronDown
										size={16}
										class="transition-transform duration-200 {isDetailsExpanded(node.path) ? 'rotate-180' : ''}"
									/>
								</button>
							</td>
						</tr>
						{#if isDetailsExpanded(node.path)}
							<tr class="bg-zinc-50/50">
								<td colspan="4" class="px-6 py-4">
									<div class="pl-8 border-l-2 border-zinc-200">
										<div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detailed Description</div>
										<div class="text-sm text-zinc-700 leading-relaxed mb-3">
											{node.detailedDescription || node.description || 'No detailed description available.'}
										</div>
										<div class="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded inline-block">
											{node.path}
										</div>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>




























