
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/ai" | "/api/ai/test" | "/api/auth" | "/api/auth/keys" | "/api/auth/keys/[id]" | "/api/auth/key" | "/api/auth/raindrop" | "/api/auth/raindrop/callback" | "/api/auth/raindrop/disconnect" | "/api/auth/raindrop/status" | "/api/bookmarks" | "/api/bookmarks/[id]" | "/api/categories" | "/api/config" | "/api/drafts" | "/api/drafts/suggest-goals" | "/api/drafts/[id]" | "/api/drafts/[id]/publish" | "/api/drafts/[id]/stream" | "/api/generate" | "/api/generate/[id]" | "/api/sync" | "/articles" | "/articles/[id]" | "/bookmarks" | "/bookmarks/[id]" | "/drafts" | "/drafts/[id]" | "/posts" | "/posts/[slug]";
		RouteParams(): {
			"/api/auth/keys/[id]": { id: string };
			"/api/bookmarks/[id]": { id: string };
			"/api/drafts/[id]": { id: string };
			"/api/drafts/[id]/publish": { id: string };
			"/api/drafts/[id]/stream": { id: string };
			"/api/generate/[id]": { id: string };
			"/articles/[id]": { id: string };
			"/bookmarks/[id]": { id: string };
			"/drafts/[id]": { id: string };
			"/posts/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { id?: string; slug?: string };
			"/api": { id?: string };
			"/api/ai": Record<string, never>;
			"/api/ai/test": Record<string, never>;
			"/api/auth": { id?: string };
			"/api/auth/keys": { id?: string };
			"/api/auth/keys/[id]": { id: string };
			"/api/auth/key": { id?: string };
			"/api/auth/raindrop": Record<string, never>;
			"/api/auth/raindrop/callback": Record<string, never>;
			"/api/auth/raindrop/disconnect": Record<string, never>;
			"/api/auth/raindrop/status": Record<string, never>;
			"/api/bookmarks": { id?: string };
			"/api/bookmarks/[id]": { id: string };
			"/api/categories": Record<string, never>;
			"/api/config": Record<string, never>;
			"/api/drafts": { id?: string };
			"/api/drafts/suggest-goals": Record<string, never>;
			"/api/drafts/[id]": { id: string };
			"/api/drafts/[id]/publish": { id: string };
			"/api/drafts/[id]/stream": { id: string };
			"/api/generate": { id?: string };
			"/api/generate/[id]": { id: string };
			"/api/sync": Record<string, never>;
			"/articles": { id?: string };
			"/articles/[id]": { id: string };
			"/bookmarks": { id?: string };
			"/bookmarks/[id]": { id: string };
			"/drafts": { id?: string };
			"/drafts/[id]": { id: string };
			"/posts": { slug?: string };
			"/posts/[slug]": { slug: string }
		};
		Pathname(): "/" | "/api/ai/test" | "/api/auth/keys" | `/api/auth/keys/${string}` & {} | "/api/auth/key" | "/api/auth/raindrop/callback" | "/api/auth/raindrop/disconnect" | "/api/auth/raindrop/status" | "/api/bookmarks" | `/api/bookmarks/${string}` & {} | "/api/categories" | "/api/config" | "/api/drafts" | "/api/drafts/suggest-goals" | `/api/drafts/${string}` & {} | `/api/drafts/${string}/publish` & {} | `/api/drafts/${string}/stream` & {} | `/api/generate/${string}` & {} | "/api/sync" | `/articles/${string}` & {} | "/bookmarks" | `/bookmarks/${string}` & {} | "/drafts" | `/drafts/${string}` & {} | "/posts" | `/posts/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}