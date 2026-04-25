<script lang="ts">
	/**
	 * Pagination component props
	 * 
	 * Pagination component with page navigation and ellipsis for large page counts.
	 */
	interface Props {
		/**
		 * Current active page number (1-indexed)
		 * @example
		 * ```typescript
		 * <Pagination currentPage={3} totalItems={100} />
		 * ```
		 */
		currentPage: number;
		
		/**
		 * Total number of items across all pages
		 */
		totalItems: number;
		
		/**
		 * Number of items per page
		 * @default 10
		 */
		itemsPerPage?: number;
		
		/**
		 * Additional CSS classes
		 */
		class?: string;
		
		/**
		 * Callback fired when page changes
		 * @param page - New page number
		 * @example
		 * ```typescript
		 * <Pagination 
		 *   currentPage={page}
		 *   totalItems={total}
		 *   onPageChange={(p) => setPage(p)}
		 * />
		 * ```
		 */
		onPageChange?: (page: number) => void;
	}

	let {
		currentPage,
		totalItems,
		itemsPerPage = 10,
		class: className = '',
		onPageChange,
		...restProps
	}: Props = $props();

	const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
	const startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	const endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	// Calculate which page numbers to display
	const visiblePages = $derived(() => {
		const pages: (number | 'ellipsis')[] = [];
		const maxVisible = 7; // Show up to 7 page numbers

		if (totalPages <= maxVisible) {
			// Show all pages if total is small
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Determine which pages to show around current page
			let startPage: number;
			let endPage: number;

			if (currentPage <= 3) {
				// Near the beginning: show pages 2, 3, 4
				startPage = 2;
				endPage = 4;
			} else if (currentPage >= totalPages - 2) {
				// Near the end: show last few pages
				startPage = totalPages - 3;
				endPage = totalPages - 1;
			} else {
				// Middle: show current ± 1
				startPage = currentPage - 1;
				endPage = currentPage + 1;
			}

			// Add ellipsis after first page if needed
			if (startPage > 2) {
				pages.push('ellipsis');
			}

			// Add pages around current page
			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}

			// Add ellipsis before last page if needed
			if (endPage < totalPages - 1) {
				pages.push('ellipsis');
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	});

	function handlePageChange(page: number) {
		if (page < 1 || page > totalPages || page === currentPage) {
			return;
		}
		onPageChange?.(page);
	}

	function handlePrevious() {
		if (currentPage > 1) {
			handlePageChange(currentPage - 1);
		}
	}

	function handleNext() {
		if (currentPage < totalPages) {
			handlePageChange(currentPage + 1);
		}
	}
</script>

<div
	class="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6 {className}"
	{...restProps}
>
	<!-- Mobile Navigation -->
	<div class="flex flex-1 justify-between sm:hidden">
		<button
			type="button"
			disabled={currentPage === 1}
			onclick={handlePrevious}
			class="relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
		>
			Previous
		</button>
		<button
			type="button"
			disabled={currentPage === totalPages}
			onclick={handleNext}
			class="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
		>
			Next
		</button>
	</div>

	<!-- Desktop Navigation -->
	<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
		<div>
			<p class="text-sm text-zinc-700 font-inter">
				Showing
				<span class="font-medium">{startItem}</span>
				to
				<span class="font-medium">{endItem}</span>
				of
				<span class="font-medium">{totalItems}</span>
				results
			</p>
		</div>
		<div>
			<nav aria-label="Pagination" class="isolate inline-flex -space-x-px rounded-md shadow-xs">
				<!-- Previous Button -->
				<button
					type="button"
					disabled={currentPage === 1}
					onclick={handlePrevious}
					class="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Previous"
				>
					<span class="sr-only">Previous</span>
					<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
						<path
							d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</button>

				<!-- Page Numbers -->
				{#each visiblePages() as page}
					{#if page === 'ellipsis'}
						<span
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-700 font-aspekta"
						>
							...
						</span>
					{:else}
						<button
							type="button"
							onclick={() => handlePageChange(page)}
							aria-current={page === currentPage ? 'page' : undefined}
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold font-aspekta focus:z-20 focus:outline-offset-0 transition-colors {page === currentPage
								? 'z-10 bg-zinc-900 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900'
								: 'text-zinc-900 hover:bg-zinc-50'} {page > 1 && page < totalPages ? 'hidden md:inline-flex' : 'inline-flex'}"
						>
							{page}
						</button>
					{/if}
				{/each}

				<!-- Next Button -->
				<button
					type="button"
					disabled={currentPage === totalPages}
					onclick={handleNext}
					class="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label="Next"
				>
					<span class="sr-only">Next</span>
					<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
						<path
							d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</button>
			</nav>
		</div>
	</div>
</div>

