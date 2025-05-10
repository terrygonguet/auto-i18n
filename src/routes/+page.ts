import { safe } from "@terrygonguet/utils/result"

export const load = async ({ parent, depends }) => {
	const { i18n } = await parent()
	depends("content:home.md")
	return safe(() => import(`$content/${i18n.lang}/home.md`))
		.recover(() => import("$content/en/home.md"))
		.andThen((module) => ({ content: module.default as string }))
		.unwrap()
}
