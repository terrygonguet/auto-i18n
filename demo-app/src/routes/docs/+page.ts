import { safe } from "@terrygonguet/utils/result"

export const load = async ({ parent, depends }) => {
	const { i18n } = await parent()
	depends("content:docs.md")
	return safe(() => import(`$content/${i18n.lang}/docs.md`))
		.recover(() => import("$content/en/docs.md"))
		.andThen((module) => ({ content: module.default as string }))
		.unwrap()
}
