export const load = async ({ parent }) => {
	const { i18n } = await parent()
	const md = await import(`$content/${i18n.lang}/home.md`)
	return { content: md.default as string }
}
