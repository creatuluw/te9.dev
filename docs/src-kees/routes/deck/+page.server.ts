import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Presentation is public, no permission check needed
	return {};
};

































