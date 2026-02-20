import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.SQ4tCcdk.js","_app/immutable/chunks/DUYJpfH3.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CXO41jCM.js","_app/immutable/chunks/Ajm7LH3G.js","_app/immutable/chunks/lMRCGtK8.js","_app/immutable/chunks/DwSbMHbX.js","_app/immutable/chunks/TBBbRmyM.js","_app/immutable/chunks/pK6643e_.js","_app/immutable/chunks/CrMTnRaV.js","_app/immutable/chunks/Bx0l01w4.js","_app/immutable/chunks/CdFZIrnc.js"];
export const stylesheets = [];
export const fonts = [];
