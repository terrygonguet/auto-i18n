import type { SvelteI18N } from "@terrygonguet/svelte-i18n"

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			lang: string
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
