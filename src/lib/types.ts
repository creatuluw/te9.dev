export interface PostMeta {
	title: string;
	date: string;
	description: string;
	slug: string;
	_draftId?: number;
	_draftType?: 'blog_post' | 'skill';
	_postId?: number;
	_postType?: 'blog_post' | 'skill';
}

export interface Post {
	id: number;
	draft_id: number | null;
	bookmark_id: number | null;
	title: string;
	slug: string;
	content: string;
	description: string | null;
	post_type: 'blog_post' | 'skill';
	created_at: string;
	published_at: string;
}

export interface Bookmark {
	id: number;
	raindrop_id: number;
	title: string;
	link: string;
	excerpt: string | null;
	cover: string | null;
	domain: string | null;
	type: string;
	tags: string[];
	blog_approved: boolean | null;
	reason_for_bookmark: string | null;
	category: string;
	created_at: string;
	raindrop_created_at: string | null;
	raindrop_updated_at: string | null;
}

export type DraftType = 'blog_post' | 'skill';

export interface DraftMetadata {
	repurposing_goals?: string;
	web_research_enabled?: boolean;
	custom_title?: string;
}

export interface Draft {
	id: number;
	bookmark_id: number;
	title: string;
	slug: string;
	content: string;
	status: 'pending' | 'approved' | 'rejected';
	feedback: string | null;
	draft_type: DraftType;
	metadata: DraftMetadata | null;
	created_at: string;
	updated_at: string;
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	created_at: string;
}

export interface ApiKey {
	id: number;
	key: string;
	name: string | null;
	created_at: string;
	last_used_at: string | null;
}

export interface AppConfig {
	polling: {
		interval_minutes: number;
		enabled: boolean;
	};
	ai: {
		provider: 'anthropic' | 'openai' | 'openrouter';
		model: string;
		api_key?: string;
		base_url?: string;
	};
	raindrop: {
		last_sync_at: string | null;
		refresh_token?: string;
	};
}

export interface RaindropItem {
	_id: number;
	title: string;
	link: string;
	excerpt?: string;
	cover?: string;
	domain?: string;
	type?: string;
	tags?: string[];
	created?: string;
	lastUpdate?: string;
}
