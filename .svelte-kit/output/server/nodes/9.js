import * as server from '../entries/pages/posts/_slug_/_page.server.ts.js';

export const index = 9;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/posts/_slug_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/posts/[slug]/+page.server.ts";
export const imports = ["_app/immutable/nodes/9.B1moFUVp.js","_app/immutable/chunks/DUYJpfH3.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CrMTnRaV.js","_app/immutable/chunks/Bl0gCdz7.js","_app/immutable/chunks/lMRCGtK8.js","_app/immutable/chunks/DwSbMHbX.js"];
export const stylesheets = [];
export const fonts = [];
