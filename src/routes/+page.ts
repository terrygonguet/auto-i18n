export const load = async ({ parent, depends }) => {
	const { i18n } = await parent()
	depends("content:home.md")
	try {
		const md = await import(`$content/${i18n.lang}/home.md`)
		return { content: md.default as string }
	} catch (error) {
		const md = await import("$content/en/home.md")
		return { content: md.default as string }
	}
}
