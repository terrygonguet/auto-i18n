export const load = async ({ parent, depends }) => {
	const { i18n } = await parent()
	depends("content:home.md")
	const md = await import(`$content/${i18n.lang}/home.md`)
	return { content: md.default as string }
}
