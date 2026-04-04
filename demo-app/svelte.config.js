import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		experimental: { async: true },
	},
	kit: {
		adapter: adapter(),
		alias: {
			"$minilib/*": "src/minilib/*",
			"$assets/*": "assets/*",
			"$content/*": "src/content/*",
			"$$/styles.css": "src/styles.css",
		},
	},
}

export default config
