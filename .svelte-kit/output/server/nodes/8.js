import * as server from '../entries/pages/posts/_page.server.ts.js';

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/posts/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/posts/+page.server.ts";
export const imports = ["_app/immutable/nodes/8._tNXJvDP.js","_app/immutable/chunks/DUYJpfH3.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CrMTnRaV.js","_app/immutable/chunks/Ajm7LH3G.js","_app/immutable/chunks/lMRCGtK8.js","_app/immutable/chunks/DwSbMHbX.js"];
export const stylesheets = [];
export const fonts = [];
