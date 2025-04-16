// See https://svelte.dev/docs/kit/types#app.d.ts

import type { AutoI18N } from "auto-i18n"

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			i18n: AutoI18N
			t: AutoI18N["t"]
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
