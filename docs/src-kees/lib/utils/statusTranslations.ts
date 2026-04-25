/**
 * Translate status values to Dutch
 * Supports both old (pending/active/completed) and new unified statuses (gepland/mee_bezig/afgerond)
 */
export function translateStatus(status: string): string {
	const statusMap: Record<string, string> = {
		// Old status values (for backward compatibility)
		pending: 'gepland',
		active: 'mee bezig',
		in_progress: 'mee bezig',
		completed: 'afgerond',
		overdue: 'te laat',
		// New unified status values
		gepland: 'gepland',
		mee_bezig: 'mee bezig',
		afgerond: 'afgerond'
	};
	
	return statusMap[status] || status;
}

