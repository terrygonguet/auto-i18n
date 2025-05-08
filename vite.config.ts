import tailwindcss from "@tailwindcss/vite"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig, type Plugin } from "vite"
import { dataToEsm } from "@rollup/pluginutils"
import { Marked } from "marked"

export default defineConfig({
	plugins: [tailwindcss(), transformMD(), sveltekit()],
})

function transformMD(): Plugin {
	const marked = new Marked({ async: false })
	return {
		name: "transform-markdown",
		transform(src, id) {
			if (id.endsWith(".md")) {
				const html = marked.parse(src)
				return {
					code: dataToEsm(html),
					map: null,
				}
			}
		},
	}
}
