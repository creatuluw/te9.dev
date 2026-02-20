/// <reference types="@sveltejs/kit" />

interface PostMeta {
	title: string;
	date: string;
	description: string;
	slug: string;
}

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};
