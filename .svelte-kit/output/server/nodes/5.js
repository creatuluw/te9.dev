import * as server from '../entries/pages/bookmarks/_id_/_page.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/bookmarks/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/bookmarks/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/5.Dgi48L4N.js","_app/immutable/chunks/DUYJpfH3.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CrMTnRaV.js","_app/immutable/chunks/CbUH2uBF.js","_app/immutable/chunks/B_Hwkqdh.js","_app/immutable/chunks/Ajm7LH3G.js","_app/immutable/chunks/lMRCGtK8.js","_app/immutable/chunks/DwSbMHbX.js","_app/immutable/chunks/Bx0l01w4.js","_app/immutable/chunks/pK6643e_.js","_app/immutable/chunks/CUNOFHbN.js","_app/immutable/chunks/BV3QDZ6R.js","_app/immutable/chunks/POesRTf2.js","_app/immutable/chunks/CXO41jCM.js","_app/immutable/chunks/CdFZIrnc.js","_app/immutable/chunks/COgvsDYZ.js"];
export const stylesheets = [];
export const fonts = [];
