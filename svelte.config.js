import adapter from "@sveltejs/adapter-auto"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			"@terrygonguet/auto-i18n/editor": "src/lib/editor.svelte.js",
			"@terrygonguet/auto-i18n/server": "src/lib/server.js",
			"@terrygonguet/auto-i18n": "src/lib/index.js",
			"$minilib/*": "src/minilib/*",
			"$routes/*": ".svelte-kit/types/src/routes/*",
			"$$/routes/*": "src/routes/*",
			"$$/styles.css": "src/styles.css",
		},
	},
}

export default config
