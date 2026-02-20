export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.eHnDtmeS.js",app:"_app/immutable/entry/app.DGKYH2v1.js",imports:["_app/immutable/entry/start.eHnDtmeS.js","_app/immutable/chunks/Cs6FA9Pw.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CXO41jCM.js","_app/immutable/entry/app.DGKYH2v1.js","_app/immutable/chunks/BD00kAjd.js","_app/immutable/chunks/CrMTnRaV.js","_app/immutable/chunks/DUYJpfH3.js","_app/immutable/chunks/CXO41jCM.js","_app/immutable/chunks/CbUH2uBF.js","_app/immutable/chunks/B_Hwkqdh.js","_app/immutable/chunks/CdFZIrnc.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/ai/test",
				pattern: /^\/api\/ai\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/test/_server.ts.js'))
			},
			{
				id: "/api/auth/keys",
				pattern: /^\/api\/auth\/keys\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/keys/_server.ts.js'))
			},
			{
				id: "/api/auth/keys/[id]",
				pattern: /^\/api\/auth\/keys\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/keys/_id_/_server.ts.js'))
			},
			{
				id: "/api/auth/key",
				pattern: /^\/api\/auth\/key\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/key/_server.ts.js'))
			},
			{
				id: "/api/auth/raindrop/callback",
				pattern: /^\/api\/auth\/raindrop\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/raindrop/callback/_server.ts.js'))
			},
			{
				id: "/api/auth/raindrop/disconnect",
				pattern: /^\/api\/auth\/raindrop\/disconnect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/raindrop/disconnect/_server.ts.js'))
			},
			{
				id: "/api/auth/raindrop/status",
				pattern: /^\/api\/auth\/raindrop\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/raindrop/status/_server.ts.js'))
			},
			{
				id: "/api/bookmarks",
				pattern: /^\/api\/bookmarks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bookmarks/_server.ts.js'))
			},
			{
				id: "/api/bookmarks/[id]",
				pattern: /^\/api\/bookmarks\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/bookmarks/_id_/_server.ts.js'))
			},
			{
				id: "/api/categories",
				pattern: /^\/api\/categories\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/categories/_server.ts.js'))
			},
			{
				id: "/api/config",
				pattern: /^\/api\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/config/_server.ts.js'))
			},
			{
				id: "/api/drafts",
				pattern: /^\/api\/drafts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/drafts/_server.ts.js'))
			},
			{
				id: "/api/drafts/suggest-goals",
				pattern: /^\/api\/drafts\/suggest-goals\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/drafts/suggest-goals/_server.ts.js'))
			},
			{
				id: "/api/drafts/[id]",
				pattern: /^\/api\/drafts\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/drafts/_id_/_server.ts.js'))
			},
			{
				id: "/api/drafts/[id]/publish",
				pattern: /^\/api\/drafts\/([^/]+?)\/publish\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/drafts/_id_/publish/_server.ts.js'))
			},
			{
				id: "/api/drafts/[id]/stream",
				pattern: /^\/api\/drafts\/([^/]+?)\/stream\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/drafts/_id_/stream/_server.ts.js'))
			},
			{
				id: "/api/generate/[id]",
				pattern: /^\/api\/generate\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/generate/_id_/_server.ts.js'))
			},
			{
				id: "/api/sync",
				pattern: /^\/api\/sync\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/sync/_server.ts.js'))
			},
			{
				id: "/articles/[id]",
				pattern: /^\/articles\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/bookmarks",
				pattern: /^\/bookmarks\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/bookmarks/[id]",
				pattern: /^\/bookmarks\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/drafts",
				pattern: /^\/drafts\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/drafts/[id]",
				pattern: /^\/drafts\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/posts",
				pattern: /^\/posts\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/posts/[slug]",
				pattern: /^\/posts\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
