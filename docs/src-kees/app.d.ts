// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Permission } from '$lib/schemas/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				roles: string[];
				permissions: Permission[];
				is_sysadmin: boolean;
			} | null;
			permissions: Permission[];
			roles: string[];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
