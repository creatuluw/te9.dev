/**
 * Date utilities for ISO week calculations
 * 
 * ISO 8601 week standard:
 * - Week starts on Monday
 * - Week 1 is the first week with a Thursday
 * - Week numbers range from 1-53
 */

/**
 * Get ISO week number for a date (1-53)
 * 
 * @param date - Date to get week number for
 * @returns ISO week number (1-53)
 * 
 * @example
 * ```typescript
 * const week = getISOWeek(new Date('2025-01-26')); // 4
 * ```
 */
export function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get ISO week year for a date
 * ISO week year may differ from calendar year for dates in Jan/Dec
 * 
 * @param date - Date to get week year for
 * @returns ISO week year
 * 
 * @example
 * ```typescript
 * const year = getISOWeekYear(new Date('2025-01-01')); // 2025 or 2024 depending on week
 * ```
 */
export function getISOWeekYear(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	return d.getUTCFullYear();
}

/**
 * Get the Monday (start) of the ISO week for a date
 * 
 * @param date - Date to get week start for
 * @returns Monday of the ISO week
 * 
 * @example
 * ```typescript
 * const monday = getWeekStartDate(new Date('2025-01-26')); // Monday of that week
 * ```
 */
export function getWeekStartDate(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	return new Date(d.setDate(diff));
}

/**
 * Get week numbers (1-5) that occur in a given month
 * ISO weeks can span month boundaries, so we need to check which weeks
 * have at least 4 days in the month (ISO standard)
 * 
 * @param year - Year
 * @param month - Month (0-11, where 0 = January)
 * @returns Array of week numbers (1-5) that occur in this month
 * 
 * @example
 * ```typescript
 * const weeks = getMonthWeeks(2025, 0); // Weeks in January 2025
 * ```
 */
export function getMonthWeeks(year: number, month: number): number[] {
	const weeks = new Set<number>();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	
	// Check each day in the month
	for (let day = 1; day <= lastDay.getDate(); day++) {
		const date = new Date(year, month, day);
		const weekNum = getISOWeek(date);
		
		// Count how many days of this week are in this month
		const weekStart = getWeekStartDate(date);
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 6);
		
		let daysInMonth = 0;
		for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
			if (d.getMonth() === month && d.getFullYear() === year) {
				daysInMonth++;
			}
		}
		
		// ISO standard: week belongs to month if it has 4+ days in that month
		if (daysInMonth >= 4) {
			weeks.add(weekNum);
		}
	}
	
	// Convert to array and map to week position in month (1-5)
	const weekArray = Array.from(weeks).sort((a, b) => a - b);
	
	// Map to week position in month (1-5)
	// Find the first week that starts in this month
	const firstWeekStart = getWeekStartDate(firstDay);
	const firstWeekNum = getISOWeek(firstDay);
	
	const result: number[] = [];
	let weekPosition = 1;
	
	for (const weekNum of weekArray) {
		// Check if this week starts in this month
		const weekStart = getWeekStartDate(new Date(year, month, 1));
		// Find the date that belongs to this week
		let foundDate: Date | null = null;
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			if (getISOWeek(date) === weekNum) {
				foundDate = date;
				break;
			}
		}
		
		if (foundDate) {
			const startOfWeek = getWeekStartDate(foundDate);
			if (startOfWeek.getMonth() === month && startOfWeek.getFullYear() === year) {
				result.push(weekPosition);
				weekPosition++;
			} else {
				// Week starts in previous month, but we still count it
				result.push(weekPosition);
				weekPosition++;
			}
		}
	}
	
	// Ensure we return at most 5 weeks
	return result.slice(0, 5);
}

/**
 * Get which week of the month (1-5) a date falls into
 * Based on ISO week calculation - determines which week position (1-5) within the month
 * 
 * @param date - Date to check
 * @returns Week number within the month (1-5)
 * 
 * @example
 * ```typescript
 * const weekInMonth = getWeekInMonth(new Date('2025-01-15')); // 2 or 3
 * ```
 */
export function getWeekInMonth(date: Date): number {
	const year = date.getFullYear();
	const month = date.getMonth();
	const isoWeekNum = getISOWeek(date);
	
	// Get all days in the month and their ISO week numbers
	const lastDay = new Date(year, month + 1, 0).getDate();
	const weekMap = new Map<number, number>(); // ISO week -> first occurrence day
	
	// Find the first day of each ISO week that appears in this month
	for (let day = 1; day <= lastDay; day++) {
		const d = new Date(year, month, day);
		const week = getISOWeek(d);
		
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
		
		// ISO standard: week belongs to month if it has 4+ days
		if (daysInMonth >= 4 && !weekMap.has(week)) {
			weekMap.set(week, day);
		}
	}
	
	// Sort weeks by their first occurrence day
	const sortedWeeks = Array.from(weekMap.entries())
		.sort((a, b) => a[1] - b[1])
		.map(([week]) => week);
	
	// Find position of this date's week
	const weekIndex = sortedWeeks.indexOf(isoWeekNum);
	
	// Return 1-5, or 1 if not found (shouldn't happen)
	return weekIndex >= 0 ? Math.min(weekIndex + 1, 5) : 1;
}

/**
 * Format month label for display
 * 
 * @param year - Year
 * @param month - Month (0-11, where 0 = January)
 * @returns Formatted month label (e.g., "Jan 2025")
 * 
 * @example
 * ```typescript
 * const label = formatMonthLabel(2025, 0); // "Jan 2025"
 * ```
 */
export function formatMonthLabel(year: number, month: number): string {
	const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
	return `${months[month]} ${year}`;
}

/**
 * Get all months in a date range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of month objects with year, month, and label
 * 
 * @example
 * ```typescript
 * const months = getMonthsInRange(new Date('2025-01-01'), new Date('2025-06-30'));
 * ```
 */
export function getMonthsInRange(startDate: Date, endDate: Date): Array<{ year: number; month: number; label: string }> {
	const months: Array<{ year: number; month: number; label: string }> = [];
	const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
	const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
	
	while (current <= end) {
		months.push({
			year: current.getFullYear(),
			month: current.getMonth(),
			label: formatMonthLabel(current.getFullYear(), current.getMonth())
		});
		current.setMonth(current.getMonth() + 1);
	}
	
	return months;
}

/**
 * Get Friday date of the week (week starts on Monday, Friday is +4 days)
 * 
 * @param weekStartDate - Monday date of the week
 * @returns Friday date of the same week
 * 
 * @example
 * ```typescript
 * const monday = getWeekStartDate(new Date('2025-01-26'));
 * const friday = getWeekFridayDate(monday); // Friday of that week
 * ```
 */
export function getWeekFridayDate(weekStartDate: Date): Date {
	const friday = new Date(weekStartDate);
	friday.setDate(friday.getDate() + 4); // Monday + 4 = Friday
	return friday;
}

