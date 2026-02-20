import type { Handle } from '@sveltejs/kit';
import { startSyncService } from '$lib/server/sync';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};

startSyncService();
