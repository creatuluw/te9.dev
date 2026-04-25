<script lang="ts">
	import { ChevronRight, ChevronDown, Search, Check, Folder, FolderOpen } from 'lucide-svelte';
	import type { Permission } from '$lib/schemas/auth';

	interface PermissionNode {
		route: string;
		permissions: Permission[];
		children: Map<string, PermissionNode>;
		expanded?: boolean;
	}

	interface Props {
		/** All available permissions */
		permissions: Permission[];
		
		/** Currently selected permission IDs */
		selectedPermissions?: number[];
		
		/** Change handler - receives array of selected permission IDs */
		onchange?: (selectedIds: number[]) => void;
		
		/** Readonly mode - no interaction */
		readonly?: boolean;
		
		/** Show action-level checkboxes */
		showActions?: boolean;
		
		/** Additional CSS classes */
		class?: string;
	}

	let {
		permissions,
		selectedPermissions = [],
		onchange,
		readonly = false,
		showActions = true,
		class: className = ''
	}: Props = $props();

	let searchQuery = $state('');
	let selectedIds = $state<Set<number>>(new Set(selectedPermissions));
	let expandedNodes = $state<Set<string>>(new Set());

	// Update selected IDs when prop changes
	$effect(() => {
		selectedIds = new Set(selectedPermissions);
	});

	// Build tree structure from flat permissions list
	const permissionTree = $derived.by(() => {
		const root: PermissionNode = {
			route: '',
			permissions: [],
			children: new Map()
		};

		// Filter permissions by search query
		const filteredPermissions = searchQuery
			? permissions.filter(p =>
					p.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.description?.toLowerCase().includes(searchQuery.toLowerCase())
			  )
			: permissions;

		// Group by route patterns
		for (const perm of filteredPermissions) {
			const parts = perm.route.split('/').filter(Boolean);
			let currentNode = root;

			// Build tree path
			let currentPath = '';
			for (let i = 0; i < parts.length; i++) {
				currentPath += '/' + parts[i];
				
				if (!currentNode.children.has(currentPath)) {
					currentNode.children.set(currentPath, {
						route: currentPath,
						permissions: [],
						children: new Map()
					});
				}
				
				currentNode = currentNode.children.get(currentPath)!;
			}

			// Add permission to leaf node
			currentNode.permissions.push(perm);
		}

		return root;
	});

	// Get flat list of all route patterns for expanding
	const allRoutes = $derived.by(() => {
		const routes: string[] = [];
		
		function collectRoutes(node: PermissionNode) {
			if (node.route) routes.push(node.route);
			for (const child of node.children.values()) {
				collectRoutes(child);
			}
		}
		
		collectRoutes(permissionTree);
		return routes;
	});

	// Toggle node expansion
	function toggleNode(route: string) {
		if (expandedNodes.has(route)) {
			expandedNodes.delete(route);
		} else {
			expandedNodes.add(route);
		}
		expandedNodes = new Set(expandedNodes);
	}

	// Expand all nodes
	function expandAll() {
		expandedNodes = new Set(allRoutes);
	}

	// Collapse all nodes
	function collapseAll() {
		expandedNodes.clear();
		expandedNodes = new Set(expandedNodes);
	}

	// Toggle permission selection
	function togglePermission(permissionId: number) {
		if (readonly) return;

		if (selectedIds.has(permissionId)) {
			selectedIds.delete(permissionId);
		} else {
			selectedIds.add(permissionId);
		}
		selectedIds = new Set(selectedIds);
		
		onchange?.(Array.from(selectedIds));
	}

	// Toggle all permissions in a node recursively
	function toggleNodePermissionsRecursive(node: PermissionNode) {
		if (readonly) return;

		// Collect all permission IDs in this node and children
		const allPermIds: number[] = [];
		
		function collectIds(n: PermissionNode) {
			n.permissions.forEach(p => allPermIds.push(p.id));
			n.children.forEach(child => collectIds(child));
		}
		
		collectIds(node);
		
		// Check if all are selected
		const allSelected = allPermIds.every(id => selectedIds.has(id));

		if (allSelected) {
			// Deselect all
			allPermIds.forEach(id => selectedIds.delete(id));
		} else {
			// Select all
			allPermIds.forEach(id => selectedIds.add(id));
		}

		selectedIds = new Set(selectedIds);
		onchange?.(Array.from(selectedIds));
	}

	// Check if a node has any selected permissions
	function hasSelectedPermissions(node: PermissionNode): boolean {
		// Check direct permissions
		if (node.permissions.some(p => selectedIds.has(p.id))) return true;
		
		// Check children recursively
		for (const child of node.children.values()) {
			if (hasSelectedPermissions(child)) return true;
		}
		
		return false;
	}
	
	// Check if all permissions in a node (and children) are selected
	function areAllPermissionsSelected(node: PermissionNode): boolean {
		const allPermIds: number[] = [];
		
		function collectIds(n: PermissionNode) {
			n.permissions.forEach(p => allPermIds.push(p.id));
			n.children.forEach(child => collectIds(child));
		}
		
		collectIds(node);
		
		if (allPermIds.length === 0) return false;
		return allPermIds.every(id => selectedIds.has(id));
	}

	// Get display name for route
	function getRouteDisplayName(route: string): string {
		if (route === '/') return 'Home';
		const parts = route.split('/').filter(Boolean);
		return parts[parts.length - 1] || '/';
	}

	// Get action badge color
	function getActionColor(action: string): string {
		switch (action) {
			case 'read': return 'bg-blue-50 text-blue-700 border-blue-100';
			case 'write': return 'bg-green-50 text-green-700 border-green-100';
			case 'delete': return 'bg-red-50 text-red-700 border-red-100';
			case 'execute': return 'bg-purple-50 text-purple-700 border-purple-100';
			default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
		}
	}

	// Flatten tree for rendering
	const flattenedTree = $derived.by(() => {
		const result: any[] = [];

		function flatten(node: PermissionNode, level: number = 0) {
			if (!node.route) {
				// Root node - check if it has permissions (e.g., for "/" route)
				if (node.permissions.length > 0) {
					// Create a special node for root-level permissions
					const rootNode: PermissionNode = {
						route: '/',
						permissions: node.permissions,
						children: new Map()
					};
					const isExpanded = expandedNodes.has('/');
					const hasChildren = false;
					const hasPerms = true;
					const isSelected = hasSelectedPermissions(rootNode);
					const isAllSelected = areAllPermissionsSelected(rootNode);
					result.push({ node: rootNode, level: 0, isExpanded, hasChildren, hasPerms, isSelected, isAllSelected });
				}
				
				// Then process children
				for (const child of node.children.values()) {
					flatten(child, level);
				}
				return;
			}

			const isExpanded = expandedNodes.has(node.route);
			const hasChildren = node.children.size > 0;
			const hasPerms = node.permissions.length > 0;
			const isSelected = hasSelectedPermissions(node);
			const isAllSelected = areAllPermissionsSelected(node);

			result.push({ node, level, isExpanded, hasChildren, hasPerms, isSelected, isAllSelected });

			if (isExpanded && hasChildren) {
				for (const child of node.children.values()) {
					flatten(child, level + 1);
				}
			}
		}

		flatten(permissionTree);
		return result;
	});
</script>

<div class="permission-tree {className}">
	<!-- Search and controls -->
	<div class="mb-4 space-y-3">
		<!-- Search -->
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Zoek permissies..."
				class="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent shadow-sm transition-shadow"
			/>
		</div>

		<!-- Expand/Collapse controls -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={expandAll}
					class="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
				>
					Alles uitklappen
				</button>
				<span class="text-zinc-300">|</span>
				<button
					type="button"
					onclick={collapseAll}
					class="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
				>
					Alles inklappen
				</button>
			</div>
			<span class="text-xs font-medium text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
				{selectedIds.size} geselecteerd
			</span>
		</div>
	</div>

	<!-- Tree -->
	<div class="tree-container border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-sm">
		{#if flattenedTree.length === 0}
			<div class="p-12 text-center">
				<div class="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
					<Search class="text-zinc-300" size={20} />
				</div>
				<p class="text-zinc-500 text-sm font-medium">
					{searchQuery ? 'Geen permissies gevonden' : 'Geen permissies beschikbaar'}
				</p>
			</div>
		{:else}
			<div class="divide-y divide-zinc-50">
				{#each flattenedTree as { node, level, isExpanded, hasChildren, hasPerms, isSelected, isAllSelected }}
					<div class="tree-node group" class:bg-zinc-50={isExpanded && hasChildren}>
						<!-- Node header -->
						<div 
							class="flex items-center gap-3 py-2.5 px-4 hover:bg-zinc-50 transition-colors cursor-pointer select-none"
							style="padding-left: {Math.max(1, level * 1.5)}rem"
							role="button"
							tabindex={hasChildren ? 0 : -1}
							onclick={() => hasChildren && toggleNode(node.route)}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && hasChildren) {
									e.preventDefault();
									toggleNode(node.route);
								}
							}}
						>
							<!-- Expand/collapse button -->
							<div class="w-5 h-5 flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:text-zinc-600 transition-colors">
								{#if hasChildren}
									{#if isExpanded}
										<ChevronDown size={16} />
									{:else}
										<ChevronRight size={16} />
									{/if}
								{:else}
									<div class="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
								{/if}
							</div>

							<!-- Icon -->
							<div class="text-zinc-400 group-hover:text-zinc-600 transition-colors">
								{#if isExpanded}
									<FolderOpen size={16} />
								{:else}
									<Folder size={16} />
								{/if}
							</div>

							<!-- Route name -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="font-medium text-sm text-zinc-900 font-aspekta">
										{getRouteDisplayName(node.route)}
									</span>
									<span class="text-xs text-zinc-400 font-mono">
										{node.route}
									</span>
								</div>
							</div>

							<!-- Select all toggle for node -->
							{#if !readonly}
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										toggleNodePermissionsRecursive(node);
									}}
									class="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors
										{isAllSelected 
											? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
											: isSelected 
												? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' 
												: 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}"
									title={isAllSelected ? 'Deselecteer groep' : 'Selecteer groep'}
								>
									{#if isAllSelected}
										<Check size={12} />
										<span>Geselecteerd</span>
									{:else if isSelected}
										<div class="w-2 h-2 rounded-full bg-zinc-400"></div>
										<span>Deels</span>
									{:else}
										<span>Selecteer</span>
									{/if}
								</button>
							{/if}
						</div>

						<!-- Permissions list (if expanded or leaf node) -->
						{#if hasPerms && (isExpanded || !hasChildren)}
							<div class="pl-12 pr-4 pb-3 space-y-2" style="padding-left: {Math.max(3, level * 1.5 + 2)}rem">
								{#each node.permissions as permission}
									<label 
										class="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer group/perm
										{selectedIds.has(permission.id) ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100' : ''}"
									>
										<!-- Checkbox -->
										{#if !readonly}
											<div class="pt-0.5">
												<input
													type="checkbox"
													checked={selectedIds.has(permission.id)}
													onchange={() => togglePermission(permission.id)}
													class="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
												/>
											</div>
										{/if}

										<!-- Permission details -->
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between gap-2 mb-1">
												<div class="text-sm font-medium text-zinc-900 font-mono">
													{permission.route}
												</div>
												<!-- Actions -->
												{#if showActions && Array.isArray(permission.actions) && permission.actions.length > 0}
													<div class="flex flex-wrap gap-1">
														{#each permission.actions as action}
															<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border {getActionColor(action)}">
																{action}
															</span>
														{/each}
													</div>
												{/if}
											</div>
											
											{#if permission.description}
												<div class="text-xs text-zinc-500 group-hover/perm:text-zinc-700 transition-colors">
													{permission.description}
												</div>
											{/if}
										</div>
									</label>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	@reference "tailwindcss";
	
	.permission-tree {
		@apply w-full;
	}

	.tree-container {
		max-height: 600px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: theme('colors.zinc.300') transparent;
	}
	
	.tree-container::-webkit-scrollbar {
		width: 6px;
	}
	
	.tree-container::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.tree-container::-webkit-scrollbar-thumb {
		background-color: theme('colors.zinc.300');
		border-radius: 20px;
	}
</style>
