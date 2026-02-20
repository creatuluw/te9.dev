import cron from 'node-cron';
import { syncBookmarks } from './raindrop';
import { db } from './db';

let syncJob: cron.ScheduledTask | null = null;

export function startSyncService(): void {
	const pollingConfig = {
		interval_minutes: 240,
		enabled: true
	};
	
	if (!pollingConfig.enabled) {
		console.log('[Sync] Polling is disabled');
		return;
	}
	
	const intervalHours = pollingConfig.interval_minutes / 60;
	const cronExpression = `0 */${intervalHours} * * *`;
	
	console.log(`[Sync] Starting sync service with interval: ${pollingConfig.interval_minutes} minutes`);
	
	syncJob = cron.schedule(cronExpression, async () => {
		console.log('[Sync] Starting scheduled sync...');
		try {
			const result = await triggerSync();
			console.log(`[Sync] Completed: ${result.added} added, ${result.updated} updated`);
		} catch (error) {
			console.error('[Sync] Failed:', error);
		}
	});
	
	console.log('[Sync] Service started successfully');
}

export function stopSyncService(): void {
	if (syncJob) {
		syncJob.stop();
		syncJob = null;
		console.log('[Sync] Service stopped');
	}
}

export async function triggerSync(limit?: number, days?: number): Promise<{ added: number; updated: number; skipped: number; hasMore: boolean; total: number }> {
	console.log('[Sync] Manual sync triggered', { limit, days });
	return syncBookmarks({ limit, days });
}

export async function updateSyncInterval(minutes: number): Promise<void> {
	await db.config.set('polling', { interval_minutes: minutes, enabled: true });
	
	stopSyncService();
	startSyncService();
	
	console.log(`[Sync] Interval updated to ${minutes} minutes`);
}
