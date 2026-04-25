<script lang="ts">
	import { getWeekStartDate, getWeekInMonth } from '$lib/utils/dateUtils';
	import { X } from 'lucide-svelte';

	interface Props {
		/**
		 * Heatmap data as a Map with keys in format "YYYY-MM-WW" (year-month-week)
		 * and values as numbers (typically percentages 0-100)
		 */
		data: Map<string, number>;
		
		/**
		 * Row labels (e.g., ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"])
		 */
		rowLabels: string[];
		
		/**
		 * Column labels (e.g., ["Jan 2025", "Feb 2025", ...])
		 */
		columnLabels: string[];
		
		/**
		 * Optional formatter for cell values
		 * @default (v) => v.toString()
		 */
		valueFormatter?: (value: number) => string;
		
		/**
		 * Optional availability data (available hours per week)
		 */
		availabilityData?: Map<string, number>;
		
		/**
		 * Optional planned hours data (planned hours per week)
		 */
		plannedHoursData?: Map<string, number>;
		
		/**
		 * Whether cells are droppable
		 * @default false
		 */
		droppable?: boolean;
		
	/**
	 * Callback when an item is dropped on a cell
	 * @param rowIndex - Row index (0-based)
	 * @param columnLabel - Column label (e.g., "Jan 2025")
	 * @param fridayDate - Friday date of the week (YYYY-MM-DD format)
	 */
	ondrop?: (rowIndex: number, columnLabel: string, fridayDate: string) => void;
	
	/**
	 * Callback when a cell is clicked
	 * @param rowIndex - Row index (0-based)
	 * @param columnLabel - Column label (e.g., "Jan 2025")
	 * @param weekStartDate - Monday date of the week (YYYY-MM-DD format)
	 * @param weekEndDate - Sunday date of the week (YYYY-MM-DD format)
	 */
	onclick?: (rowIndex: number, columnLabel: string, weekStartDate: string, weekEndDate: string) => void;
	
	/**
	 * Selected week start date (YYYY-MM-DD format) for highlighting
	 */
	selectedWeekStart?: string | null;
	
	/**
	 * Selected week end date (YYYY-MM-DD format) for highlighting
	 */
	selectedWeekEnd?: string | null;
	
	/**
	 * Hovered week start date (YYYY-MM-DD format) for highlighting
	 */
	hoveredWeekStart?: string | null;
	
	/**
	 * Hovered week end date (YYYY-MM-DD format) for highlighting
	 */
	hoveredWeekEnd?: string | null;
	
	/**
	 * Additional CSS classes
	 */
	class?: string;
	}

	let {
		data,
		rowLabels,
		columnLabels,
		valueFormatter = (v: number) => v.toString(),
		availabilityData,
		plannedHoursData,
		droppable = false,
		ondrop,
		onclick,
		selectedWeekStart,
		selectedWeekEnd,
		hoveredWeekStart,
		hoveredWeekEnd,
		class: className = '',
		...restProps
	}: Props = $props();

	// Calculate min and max values for color scaling
	const minMax = $derived.by(() => {
		if (data.size === 0) {
			return { min: 0, max: 0 };
		}
		const values = Array.from(data.values());
		return {
			min: Math.min(...values),
			max: Math.max(...values)
		};
	});

	// Get intensity for color (0-100)
	// For percentages, use the value directly; for other data, normalize
	function getIntensity(value: number): number {
		// If values are in 0-100 range (likely percentages), use directly
		// Otherwise normalize based on min/max
		if (minMax.max <= 100 && minMax.min >= 0) {
			// Assume percentages - use value directly
			return Math.min(Math.max(value, 0), 100);
		}
		// Normalize for other data types
		if (minMax.max === minMax.min) {
			return value > 0 ? 50 : 0;
		}
		return ((value - minMax.min) / (minMax.max - minMax.min)) * 100;
	}

	// Get background color based on intensity (orange gradient, darker = higher percentage)
	// Weeks that exist within a month get subtle light green background
	function getBackgroundColor(intensity: number, weekExists: boolean = false, weekPassed: boolean = false): string {
		// If week doesn't exist or has passed, use inline style for #A8A8A8
		if (!weekExists || weekPassed) {
			return ''; // Return empty string to use inline style for custom color
		}
		// If week exists but has no data, use subtle light green
		if (intensity === 0 && weekExists) {
			return ''; // Return empty string to use inline style for custom color
		}
		// Orange gradient from light to dark (closer to 100% = darker orange)
		if (intensity < 20) return 'bg-orange-50';
		if (intensity < 40) return 'bg-orange-100';
		if (intensity < 60) return 'bg-orange-200';
		if (intensity < 80) return 'bg-orange-300';
		if (intensity < 90) return 'bg-orange-400';
		if (intensity < 95) return 'bg-orange-500';
		return 'bg-orange-600'; // Darkest orange for 95-100%
	}

	// Get inline style for background color (for custom colors like light green and gray)
	function getBackgroundStyle(intensity: number, weekExists: boolean, weekPassed: boolean): string {
		// Passed or non-existent weeks get #A8A8A8
		if (!weekExists || weekPassed) {
			return 'background-color: #A8A8A8;';
		}
		// If week exists but has no data, use subtle light green
		if (intensity === 0 && weekExists) {
			// Use rgba to create subtle light green background (#0CAE00 with 15% opacity)
			return 'background-color: rgba(12, 174, 0, 0.15);'; // Subtle light green
		}
		return '';
	}
	
	// Get inline style for dropzone to ensure it overrides Tailwind classes
	function getDropzoneStyle(isDragOver: boolean): string {
		if (!isDragOver) return '';
		return 'background-color: #30A2FF !important;';
	}

	// Get text color based on background
	function getTextColor(intensity: number): string {
		if (intensity === 0) return 'text-zinc-500';
		if (intensity < 70) return 'text-zinc-900';
		return 'text-white';
	}

	// Extract year and month from column label
	function parseColumnLabel(columnLabel: string): { year: number; month: number } | null {
		const parts = columnLabel.split(' ');
		if (parts.length !== 2) return null;
		
		const monthNames: Record<string, number> = {
			'Jan': 0, 'Feb': 1, 'Mrt': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
			'Jul': 6, 'Aug': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Dec': 11
		};
		
		const monthName = parts[0];
		const year = parseInt(parts[1]);
		const month = monthNames[monthName];
		
		if (month === undefined || isNaN(year)) return null;
		
		return { year, month };
	}

	// Get cell value for a specific row and column
	function getCellValue(rowIndex: number, columnLabel: string): number {
		const parsed = parseColumnLabel(columnLabel);
		if (!parsed) return 0;
		
		const { year, month } = parsed;
		
		// Create key: "YYYY-MM-WW" where WW is week number (1-5)
		const weekNum = rowIndex + 1; // rowIndex is 0-based, week is 1-based
		const key = `${year}-${String(month + 1).padStart(2, '0')}-${weekNum}`;
		
		return data.get(key) || 0;
	}

	// Get start and end dates for a specific week in a month
	function getWeekDateRange(rowIndex: number, columnLabel: string): { start: Date; end: Date } | null {
		const parsed = parseColumnLabel(columnLabel);
		if (!parsed) return null;
		
		const { year, month } = parsed;
		const weekNum = rowIndex + 1; // Week position in month (1-5)
		
		// Find a date in this month that belongs to the specified week
		const lastDay = new Date(year, month + 1, 0).getDate();
		let foundDate: Date | null = null;
		
		for (let day = 1; day <= lastDay; day++) {
			const d = new Date(year, month, day);
			const weekInMonthValue = getWeekInMonth(d);
			
			// Check if this week has at least 4 days in this month
			const weekStart = getWeekStartDate(d);
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekEnd.getDate() + 6);
			
			let daysInMonth = 0;
			for (let checkDate = new Date(weekStart); checkDate <= weekEnd; checkDate.setDate(checkDate.getDate() + 1)) {
				if (checkDate.getMonth() === month && checkDate.getFullYear() === year) {
					daysInMonth++;
				}
			}
			
			if (daysInMonth >= 4 && weekInMonthValue === weekNum) {
				foundDate = d;
				break;
			}
		}
		
		if (!foundDate) return null;
		
		// Get the ISO week start (Monday) and end (Sunday)
		const weekStart = getWeekStartDate(foundDate);
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 6);
		
		return { start: weekStart, end: weekEnd };
	}

	// Check if a week has already passed
	function isWeekPassed(rowIndex: number, columnLabel: string): boolean {
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return true; // If we can't determine the date, consider it passed
		
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		
		// Check if week end date (Sunday) has passed
		const weekEnd = new Date(dateRange.end);
		weekEnd.setHours(23, 59, 59, 999);
		
		return weekEnd < now;
	}

	// Check if a cell is the selected week
	function isSelectedWeek(rowIndex: number, columnLabel: string): boolean {
		if (!selectedWeekStart || !selectedWeekEnd) return false;
		
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return false;
		
		const weekStartStr = dateRange.start.toISOString().split('T')[0];
		const weekEndStr = dateRange.end.toISOString().split('T')[0];
		
		return weekStartStr === selectedWeekStart && weekEndStr === selectedWeekEnd;
	}

	// Check if a cell is the hovered week
	function isHoveredWeek(rowIndex: number, columnLabel: string): boolean {
		if (!hoveredWeekStart || !hoveredWeekEnd) return false;
		
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return false;
		
		// Normalize dates to start of day for accurate comparison
		const weekStart = new Date(dateRange.start);
		weekStart.setHours(0, 0, 0, 0);
		const weekEnd = new Date(dateRange.end);
		weekEnd.setHours(0, 0, 0, 0);
		
		const weekStartStr = weekStart.toISOString().split('T')[0];
		const weekEndStr = weekEnd.toISOString().split('T')[0];
		
		return weekStartStr === hoveredWeekStart && weekEndStr === hoveredWeekEnd;
	}

	// Check if a cell is the current week
	function isCurrentWeek(rowIndex: number, columnLabel: string): boolean {
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return false;
		
		// Get current date
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		
		// Normalize week start and end dates
		const weekStart = new Date(dateRange.start);
		weekStart.setHours(0, 0, 0, 0);
		const weekEnd = new Date(dateRange.end);
		weekEnd.setHours(23, 59, 59, 999);
		
		// Check if today falls within this week's date range
		return now >= weekStart && now <= weekEnd;
	}

	// Format date for display (DD MMM)
	function formatDateShort(date: Date): string {
		const day = date.getDate();
		const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
		const month = months[date.getMonth()];
		return `${day} ${month}`;
	}

	let hoveredCell = $state<{ row: number; col: number; element: HTMLElement | null } | null>(null);
	let tooltipStyle = $state('');
	let dragOverCell = $state<{ row: number; col: number } | null>(null);
	let hoveredDot = $state<{ element: HTMLElement | null } | null>(null);
	let dotTooltipStyle = $state('');

	function updateTooltipPosition(element: HTMLElement) {
		const rect = element.getBoundingClientRect();
		const spacing = 8; // 8px spacing above cell
		
		// Position above the cell, centered horizontally
		let tooltipTop = rect.top + window.scrollY - spacing;
		const tooltipLeft = rect.left + rect.width / 2;
		
		// Ensure tooltip stays within viewport (at least 8px from top)
		const minTop = window.scrollY + 8;
		if (tooltipTop < minTop) {
			tooltipTop = minTop;
		}
		
		tooltipStyle = `top: ${tooltipTop}px; left: ${tooltipLeft}px; transform: translateY(-100%) translateX(-50%); margin-bottom: ${spacing}px;`;
	}

	function handleMouseEnter(event: MouseEvent, rowIndex: number, colIndex: number) {
		const target = event.currentTarget as HTMLElement;
		hoveredCell = { row: rowIndex, col: colIndex, element: target };
		updateTooltipPosition(target);
	}

	function handleMouseLeave() {
		hoveredCell = null;
		tooltipStyle = '';
	}

	function updateDotTooltipPosition(element: HTMLElement) {
		const rect = element.getBoundingClientRect();
		const spacing = 8; // 8px spacing to the right of dot
		
		// Position to the right of the dot, centered vertically
		const tooltipTop = rect.top + window.scrollY + rect.height / 2;
		const tooltipLeft = rect.left + rect.width + spacing;
		
		dotTooltipStyle = `top: ${tooltipTop}px; left: ${tooltipLeft}px; transform: translateY(-50%);`;
	}

	function handleDotMouseEnter(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		hoveredDot = { element: target };
		updateDotTooltipPosition(target);
	}

	function handleDotMouseLeave() {
		hoveredDot = null;
		dotTooltipStyle = '';
	}

	function handleDragOver(event: DragEvent, rowIndex: number, colIndex: number, columnLabel: string) {
		if (!droppable) return;
		
		// Check if this week has already passed - don't allow drops on past weeks
		if (isWeekPassed(rowIndex, columnLabel)) {
			event.dataTransfer!.dropEffect = 'none';
			return;
		}
		
		// Check if dragging a task/work item - accept any drag data
		// Always prevent default and allow drop if droppable is enabled
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer!.dropEffect = 'move';
		dragOverCell = { row: rowIndex, col: colIndex };
	}

	function handleDragLeave(event: DragEvent) {
		if (!droppable) return;
		
		const target = event.currentTarget as HTMLElement;
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		
		// Only clear if actually leaving the cell (not moving to a child element)
		// Check if we're moving to another cell in the table
		if (relatedTarget) {
			// If moving to another td element, don't clear (will be set by that cell's dragover)
			if (relatedTarget.tagName === 'TD' || relatedTarget.closest('td')) {
				return;
			}
		}
		
		// Only clear if we're actually leaving the table cell area
		if (!target.contains(relatedTarget)) {
			dragOverCell = null;
		}
	}

	function handleDrop(event: DragEvent, rowIndex: number, columnLabel: string) {
		if (!droppable || !ondrop) return;
		
		// Check if this week has already passed - don't allow drops on past weeks
		if (isWeekPassed(rowIndex, columnLabel)) {
			return;
		}
		
		event.preventDefault();
		dragOverCell = null;
		
		// Get week start date for this cell
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return;
		
		// Calculate Friday date (week start + 4 days)
		const friday = new Date(dateRange.start);
		friday.setDate(friday.getDate() + 4);
		
		// Format as YYYY-MM-DD
		const fridayDate = friday.toISOString().split('T')[0];
		
		ondrop(rowIndex, columnLabel, fridayDate);
	}

	function handleCellClick(event: MouseEvent, rowIndex: number, columnLabel: string) {
		if (!onclick) return;
		
		// Don't trigger click if it was part of a drag operation
		if (dragOverCell) return;
		
		// Check if this week exists and hasn't passed
		const dateRange = getWeekDateRange(rowIndex, columnLabel);
		if (!dateRange) return;
		
		if (isWeekPassed(rowIndex, columnLabel)) return;
		
		// Format dates as YYYY-MM-DD
		const weekStartDate = dateRange.start.toISOString().split('T')[0];
		const weekEndDate = dateRange.end.toISOString().split('T')[0];
		
		onclick(rowIndex, columnLabel, weekStartDate, weekEndDate);
	}

	// Clear drag over state when drag ends globally
	$effect(() => {
		if (droppable) {
			const handleGlobalDragEnd = () => {
				dragOverCell = null;
			};
			
			document.addEventListener('dragend', handleGlobalDragEnd);
			return () => {
				document.removeEventListener('dragend', handleGlobalDragEnd);
			};
		}
	});
</script>

<div class="{className}" {...restProps}>
	<div class="overflow-x-auto">
		<table class="w-full border-collapse">
		<thead>
			<tr>
				<th class="sticky left-0 z-10 bg-white border px-4 py-2 text-right text-sm font-medium text-zinc-900 font-aspekta" style="border-color: #D3D3D3;">
					Week
				</th>
				{#each columnLabels as columnLabel}
					<th class="border px-4 py-2 text-center text-sm font-medium text-zinc-900 font-aspekta bg-zinc-50" style="border-color: #D3D3D3;">
						{columnLabel}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rowLabels as rowLabel, rowIndex}
				<tr>
					<td class="sticky left-0 z-10 bg-white border px-4 py-2 text-right text-sm font-medium text-zinc-900 font-aspekta" style="border-color: #D3D3D3;">
						{rowLabel}
					</td>
					{#each columnLabels as columnLabel, colIndex}
						{@const value = getCellValue(rowIndex, columnLabel)}
						{@const intensity = getIntensity(value)}
						{@const weekDateRange = getWeekDateRange(rowIndex, columnLabel)}
						{@const weekExists = weekDateRange !== null}
						{@const weekPassed = isWeekPassed(rowIndex, columnLabel)}
						{@const isSelected = isSelectedWeek(rowIndex, columnLabel)}
						{@const isHoveredWeekCell = isHoveredWeek(rowIndex, columnLabel)}
						{@const isCurrent = isCurrentWeek(rowIndex, columnLabel)}
						{@const bgColor = getBackgroundColor(intensity, weekExists, weekPassed)}
						{@const bgStyle = getBackgroundStyle(intensity, weekExists, weekPassed)}
						{@const textColor = getTextColor(intensity)}
						{@const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex}
						{@const isDragOver = dragOverCell?.row === rowIndex && dragOverCell?.col === colIndex}
						{@const parsed = parseColumnLabel(columnLabel)}
						{@const key = parsed ? `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}-${rowIndex + 1}` : ''}
						{@const plannedHours = plannedHoursData?.get(key) || 0}
						{@const displayValue = plannedHoursData && plannedHours > 0 ? plannedHours.toFixed(1) : (value > 0 ? valueFormatter(value) : '')}
						{@const finalBgColor = isSelected || isHoveredWeekCell ? '' : (isDragOver ? '' : bgColor)}
						{@const finalTextColor = isSelected || isHoveredWeekCell ? 'text-white' : (isDragOver ? 'text-zinc-900' : textColor)}
						{@const isDisabled = weekPassed && droppable}
						{@const finalBgStyle = isSelected || isHoveredWeekCell ? 'background-color: #3B82F6 !important;' : (isDragOver && !isDisabled ? getDropzoneStyle(true) : (bgStyle || ''))}
						{@const borderStyle = `border-color: #D3D3D3; ${finalBgStyle}`}
						{@const showBanIcon = !weekExists || weekPassed || isDisabled}
						{@const isClickable = onclick && weekExists && !weekPassed && !isDisabled}
						<td
							class="border px-4 py-2 text-center text-sm font-inter {finalBgColor} {finalTextColor} transition-colors relative {isHovered && !isDragOver && !isSelected && !isHoveredWeekCell ? 'ring-2 ring-blue-500 ring-offset-1' : ''} {isDragOver && !isDisabled ? 'dropzone-active' : ''} {droppable && !isDisabled ? 'cursor-pointer' : ''} {isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''} {isDisabled ? 'opacity-50 cursor-not-allowed' : ''} {isSelected ? 'selected-week' : ''} {isHoveredWeekCell ? 'hovered-week' : ''}"
							style={borderStyle}
							onmouseenter={(e) => handleMouseEnter(e, rowIndex, colIndex)}
							onmouseleave={handleMouseLeave}
							onclick={isClickable ? (e) => handleCellClick(e, rowIndex, columnLabel) : undefined}
							ondragover={droppable && !isDisabled ? (e) => handleDragOver(e, rowIndex, colIndex, columnLabel) : undefined}
							ondragleave={droppable ? handleDragLeave : undefined}
							ondrop={droppable && ondrop && !isDisabled ? (e) => handleDrop(e, rowIndex, columnLabel) : undefined}
							role="gridcell"
							aria-label="Week {rowIndex + 1}, {columnLabel}: {displayValue} {plannedHoursData ? 'uur' : ''} {isDisabled ? '(verstreken)' : ''} {isSelected ? '(geselecteerd)' : ''} {isHoveredWeekCell ? '(gehoverd)' : ''}"
						>
							{#if showBanIcon}
								<div class="flex items-center justify-center">
									<X size={16} style="color: #E2E2E2;" />
								</div>
							{:else}
								{displayValue}
							{/if}
							{#if isCurrent && !showBanIcon}
								<div 
									class="current-week-dot"
									style="position: absolute; top: 0.25rem; right: 0.25rem; width: 0.5rem; height: 0.5rem; border-radius: 9999px; background-color: #21F900; z-index: 10; animation: pulse 2s infinite;"
									onmouseenter={handleDotMouseEnter}
									onmouseleave={handleDotMouseLeave}
									role="button"
									tabindex={0}
									aria-label="Huidige week"
								></div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	
	{#if hoveredCell && hoveredCell.element}
		{@const hoveredWeekDateRange = getWeekDateRange(hoveredCell.row, columnLabels[hoveredCell.col])}
		{@const hoveredWeekExists = hoveredWeekDateRange !== null}
		{@const hoveredWeekPassed = isWeekPassed(hoveredCell.row, columnLabels[hoveredCell.col])}
		{@const hoveredIsDisabled = hoveredWeekPassed && droppable}
		{@const hoveredShowBanIcon = !hoveredWeekExists || hoveredWeekPassed || hoveredIsDisabled}
		{#if !hoveredShowBanIcon}
			{@const value = getCellValue(hoveredCell.row, columnLabels[hoveredCell.col])}
			{@const rowLabel = rowLabels[hoveredCell.row]}
			{@const colLabel = columnLabels[hoveredCell.col]}
			{@const dateRange = getWeekDateRange(hoveredCell.row, columnLabels[hoveredCell.col])}
			{@const parsed = parseColumnLabel(columnLabels[hoveredCell.col])}
			{@const key = parsed ? `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}-${hoveredCell.row + 1}` : ''}
			{@const plannedHours = plannedHoursData?.get(key) || 0}
			{@const availableHours = availabilityData?.get(key) || 0}
		<div
			class="fixed z-[9999] px-3 py-2 text-xs text-zinc-100 bg-zinc-900 rounded shadow-sm pointer-events-none"
			style={tooltipStyle}
			role="tooltip"
		>
			<div class="font-medium">{colLabel} - {rowLabel}: {valueFormatter(value)}</div>
			{#if plannedHoursData && availabilityData}
				<div class="text-zinc-300 mt-1">
					{plannedHours.toFixed(1)} / {availableHours.toFixed(1)} uur
				</div>
			{/if}
			{#if dateRange}
				<div class="text-zinc-300 mt-1">
					{formatDateShort(dateRange.start)} - {formatDateShort(dateRange.end)}
				</div>
			{/if}
		</div>
		{/if}
	{/if}
	
	{#if hoveredDot && hoveredDot.element}
		<div
			class="fixed z-[9999] px-3 py-2 text-xs text-zinc-100 bg-zinc-900 rounded shadow-sm pointer-events-none"
			style={dotTooltipStyle}
			role="tooltip"
		>
			<div class="font-medium">Huidige week</div>
		</div>
	{/if}
	</div>
	
	<!-- Legend -->
	{#if selectedWeekStart && selectedWeekEnd}
		<div class="mt-4 flex items-center gap-6 text-xs text-zinc-600">
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded" style="background-color: #3B82F6;"></div>
				<span>Geselecteerde week</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded bg-orange-400"></div>
				<span>60-80% gepland</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded bg-orange-200"></div>
				<span>20-40% gepland</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded" style="background-color: rgba(12, 174, 0, 0.15);"></div>
				<span>Beschikbaar</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Ensure sticky header works properly */
	thead th {
		position: sticky;
		top: 0;
	}
	
	/* Smooth transitions - spring-like easing for natural feel */
	td {
		transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1),
		            color 0.2s cubic-bezier(0.2, 0, 0, 1),
		            border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
		            transform 0.2s cubic-bezier(0.2, 0, 0, 1);
	}

	/* Dropzone active styling */
	/* Use more specific selector to override Tailwind classes */
	/* Target all possible combinations to ensure override */
	td.dropzone-active,
	:global(td.dropzone-active),
	td.bg-zinc-50.dropzone-active,
	td.bg-orange-50.dropzone-active,
	td.bg-orange-100.dropzone-active,
	td.bg-orange-200.dropzone-active,
	td.bg-orange-300.dropzone-active,
	td.bg-orange-400.dropzone-active,
	td.bg-orange-500.dropzone-active,
	td.bg-orange-600.dropzone-active {
		background-color: #30A2FF !important; /* light blue background */
		background-image: none !important; /* Remove any background images */
		animation: dropzone-pulse 1.5s ease-in-out infinite !important;
		z-index: 10 !important;
		position: relative !important;
		color: rgb(255, 255, 255) !important; /* White text for visibility on blue background */
	}

	/* Smooth pulse animation - subtle and elegant */
	@keyframes dropzone-pulse {
		0%, 100% {
			background-color: #30A2FF !important; /* light blue */
			transform: scale(1);
		}
		50% {
			background-color: #0065FF !important; /* darker blue */
			transform: scale(1.02);
		}
	}

	/* Selected week styling - blue with white text */
	td.selected-week,
	:global(td.selected-week) {
		background-color: #3B82F6 !important; /* blue-500 */
		color: white !important;
		font-weight: 600 !important;
		box-shadow: 0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
		z-index: 5 !important;
		position: relative !important;
	}

	/* Hovered week styling - blue with white text (same as selected) */
	td.hovered-week,
	:global(td.hovered-week) {
		background-color: #3B82F6 !important; /* blue-500 */
		color: white !important;
		font-weight: 600 !important;
		box-shadow: 0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
		z-index: 5 !important;
		position: relative !important;
	}

	/* Current week dot - pulse animation inspired by https://www.florin-pop.com/blog/2019/03/css-pulse-effect/ */
	.current-week-dot,
	:global(.current-week-dot),
	td .current-week-dot {
		position: absolute !important;
		top: 0.25rem !important;
		right: 0.25rem !important;
		width: 0.5rem !important;
		height: 0.5rem !important;
		border-radius: 9999px !important;
		background-color: #21F900 !important;
		box-shadow: 0 0 0 0 rgba(33, 249, 0, 1) !important;
		transform: scale(1);
		animation: pulse 2s infinite !important;
		z-index: 10 !important;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(33, 249, 0, 0.7);
		}

		70% {
			transform: scale(1);
			box-shadow: 0 0 0 6px rgba(33, 249, 0, 0);
		}

		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(33, 249, 0, 0);
		}
	}
</style>

