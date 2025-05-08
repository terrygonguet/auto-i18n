import tailwindcss from "@tailwindcss/vite"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig, type Plugin } from "vite"
import { dataToEsm } from "@rollup/pluginutils"
import { Marked } from "marked"

export default defineConfig({
	plugins: [tailwindcss(), transformMD(), sveltekit()],
})

function transformMD(): Plugin {
	const marked = new Marked(
		{ async: false },
		{
			renderer: {
				link({ href, tokens }) {
					const isExternal = href.startsWith("http")
					return `<a href="${href}" target="${isExternal ? "_blank" : "_self"}" class="text-teal-700 underline">${this.parser.parseInline(tokens)}</a>`
				},
			},
		},
	)
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
