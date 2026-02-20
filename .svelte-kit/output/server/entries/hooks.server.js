import { s as startSyncService } from "../chunks/sync.js";
const handle = async ({ event, resolve }) => {
  return resolve(event);
};
startSyncService();
export {
  handle
};
