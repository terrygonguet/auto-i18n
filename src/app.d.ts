import type { AutoI18N } from "@terrygonguet/auto-i18n"

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			i18n: AutoI18N
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
