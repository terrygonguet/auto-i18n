import { error, json, type RequestEvent } from "@sveltejs/kit"
import { safe } from "@terrygonguet/utils/result"

export interface CreateAutoI18NHandlerOptions {
	fetchCategory(options: {
		where: { lang: string; category: string }
		event: RequestEvent
	}): Promise<{ [key: string]: string } | undefined>
	fetchAll(options: {
		where: { langs?: string[]; categories?: string[] }
		event: RequestEvent
	}): Promise<{ [lang: string]: { [category: string]: { [key: string]: string } } } | undefined>
	save(
		data: { category: string; key: string; langs: { [lang: string]: string } },
		options: { event: RequestEvent },
	): Promise<void>
}

export type AutoI18NHandler = (
	event: RequestEvent,
) => Promise<{ handled: true; response: Response } | { handled: false; reason?: unknown }>

export function createAutoI18NHandler({
	fetchCategory,
	fetchAll,
	save,
}: CreateAutoI18NHandlerOptions): AutoI18NHandler {
	const categoryRegEx = /^\/locale\/(?<lang>.+)\/(?<category>.+)\.json$/
	const allRegEx = /^\/locale\/all\.json$/

	return async (event) => {
		switch (event.request.method) {
			case "GET": {
				const match = categoryRegEx.exec(event.url.pathname)
				if (match) {
					const { lang, category } = match.groups!
					const [err, data] = await safe(() =>
						fetchCategory({ where: { lang, category }, event }),
					).asTuple()
					if (err) error(500, "auto-i18n.error_get_fail")
					else if (!data) error(404, "auto-i18n.error_not_found")
					else return { handled: true, response: json(data) }
				}

				if (allRegEx.test(event.url.pathname)) {
					const categoriesParam = event.url.searchParams.get("categories")
					const categories = categoriesParam?.split(",").map((cat) => cat.trim())
					const langsParams = event.url.searchParams.get("langs")
					const langs = langsParams?.split(",").map((lang) => lang.trim())
					const [err, data] = await safe(() =>
						fetchAll({ where: { categories, langs }, event }),
					).asTuple()
					if (err) error(500, "auto-i18n.error_get_fail")
					else if (!data) error(404, "auto-i18n.error_not_found")
					else return { handled: true, response: json(data) }
				}

				return { handled: false }
			}

			case "POST": {
				if (allRegEx.test(event.url.pathname)) {
					const [parseErr, data] = await safe(() => event.request.json()).asTuple()
					if (parseErr) error(400, "auto-i18n.error_bad_input")

					if (typeof data != "object" || data == null || Array.isArray(data))
						error(400, "auto-i18n.error_bad_input")

					const { category, key, langs } = data
					if (typeof category != "string" || !category)
						error(400, "auto-i18n.error_missing_category")
					if (typeof key != "string" || !key) error(400, "auto-i18n.error_missing_key")
					if (typeof langs != "object" || !langs) error(400, "auto-i18n.error_missing_langs")

					for (const [lang, value] of Object.entries(langs)) {
						if (typeof value != "string") error(400, "auto-i18n.error_bad_langs")
					}

					const { error: err } = await safe(() =>
						save({ category, key, langs }, { event }),
					).asObject()
					if (err) error(500, "auto-i18n.error_save_fail")
					else return { handled: true, response: json({ message: "auto-i18n.update_success" }) }
				} else return { handled: false }
			}

			default:
				return { handled: false }
		}
	}
}
