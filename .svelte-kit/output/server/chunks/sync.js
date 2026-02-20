import cron from "node-cron";
import { s as syncBookmarks } from "./raindrop.js";
import "./db.js";
function startSyncService() {
  const pollingConfig = {
    interval_minutes: 240
  };
  const intervalHours = pollingConfig.interval_minutes / 60;
  const cronExpression = `0 */${intervalHours} * * *`;
  console.log(`[Sync] Starting sync service with interval: ${pollingConfig.interval_minutes} minutes`);
  cron.schedule(cronExpression, async () => {
    console.log("[Sync] Starting scheduled sync...");
    try {
      const result = await triggerSync();
      console.log(`[Sync] Completed: ${result.added} added, ${result.updated} updated`);
    } catch (error) {
      console.error("[Sync] Failed:", error);
    }
  });
  console.log("[Sync] Service started successfully");
}
async function triggerSync(limit, days) {
  console.log("[Sync] Manual sync triggered", { limit, days });
  return syncBookmarks({ limit, days });
}
export {
  startSyncService as s,
  triggerSync as t
};
