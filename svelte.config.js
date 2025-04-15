import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			"$routes/*": ".svelte-kit/types/src/routes/*",
			"$$/routes/*": "src/routes/*",
			"$$/styles.css": "src/styles.css",
		},
	},
	compilerOptions: {
		warningFilter: (warning) => warning.code != "a11y_autofocus",
	},
}

export default config
