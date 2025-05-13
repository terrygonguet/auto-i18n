import { json, type RequestEvent } from "@sveltejs/kit"
import { safe } from "@terrygonguet/utils/result"

type MaybePromise<T> = T | Promise<T>

export interface CreateAutoI18NHandlerOptions {
	fetchCategory(options: {
		where: { lang: string; category: string }
		event: RequestEvent
	}): MaybePromise<{ [key: string]: string } | undefined>
	canFetchCategory?(options: {
		where: { lang: string; category: string }
		event: RequestEvent
	}): MaybePromise<boolean>

	fetchAll(options: {
		where: { langs?: string[]; categories?: string[] }
		event: RequestEvent
	}): MaybePromise<
		{ [lang: string]: { [category: string]: { [key: string]: string } } } | undefined
	>
	canFetchAll?(options: {
		where: { langs?: string[]; categories?: string[] }
		event: RequestEvent
	}): MaybePromise<boolean>

	update(
		data: { category: string; key: string; langs: { [lang: string]: string } },
		options: { event: RequestEvent },
	): MaybePromise<void>
	canUpdate?(
		data: { category: string; key: string; langs: { [lang: string]: string } },
		options: { event: RequestEvent },
	): MaybePromise<boolean>
}

export type AutoI18NHandler = (
	event: RequestEvent,
) => Promise<{ handled: true; response: Response } | { handled: false; reason?: unknown }>

export function createAutoI18NHandler({
	fetchCategory,
	canFetchCategory,
	fetchAll,
	canFetchAll,
	update,
	canUpdate,
}: CreateAutoI18NHandlerOptions): AutoI18NHandler {
	const categoryRegEx = /^\/locale\/(?<lang>.+)\/(?<category>.+)\.json$/
	const allRegEx = /^\/locale\/all\.json$/

	// HACK: stringified `where` is the key and the full response object is the value
	const cache = new Map<string, any>()

	return async (event) => {
		switch (event.request.method) {
			case "GET": {
				const match = categoryRegEx.exec(event.url.pathname)
				if (match) {
					const { lang, category } = match.groups!
					if (canFetchCategory ? !canFetchCategory({ where: { lang, category }, event }) : false)
						return handled(403, "auto-i18n.error_access_denied")

					const cacheKey = JSON.stringify({ lang, category })
					const cached = cache.get(cacheKey)
					if (cached) return handled(200, cached)

					const [err, data] = await safe(async () =>
						fetchCategory({ where: { lang, category }, event }),
					).asTuple()
					if (err) return handled(500, "auto-i18n.error_get_fail")
					else if (!data) return handled(404, "auto-i18n.error_not_found")
					else {
						cache.set(cacheKey, data)
						return handled(200, data)
					}
				}

				if (allRegEx.test(event.url.pathname)) {
					const categoriesParam = event.url.searchParams.get("categories")
					const categories = categoriesParam?.split(",").map((cat) => cat.trim())
					const langsParams = event.url.searchParams.get("langs")
					const langs = langsParams?.split(",").map((lang) => lang.trim())
					if (canFetchAll ? !canFetchAll({ where: { langs, categories }, event }) : false)
						return handled(403, "auto-i18n.error_access_denied")

					const cacheKey = JSON.stringify({ langs, categories })
					const cached = cache.get(cacheKey)
					if (cached) return handled(200, cached)

					const [err, data] = await safe(async () =>
						fetchAll({ where: { categories, langs }, event }),
					).asTuple()
					if (err) return handled(500, "auto-i18n.error_get_fail")
					else if (!data) return handled(404, "auto-i18n.error_not_found")
					else {
						cache.set(cacheKey, data)
						return handled(200, data)
					}
				}

				return { handled: false }
			}

			case "POST": {
				if (allRegEx.test(event.url.pathname)) {
					const [parseErr, data] = await safe(() => event.request.json()).asTuple()
					if (parseErr) return handled(400, "auto-i18n.error_bad_input")

					if (typeof data != "object" || data == null || Array.isArray(data))
						return handled(400, "auto-i18n.error_bad_input")

					const { category, key, langs } = data
					if (typeof category != "string" || !category)
						return handled(400, "auto-i18n.error_missing_category")
					if (typeof key != "string" || !key) return handled(400, "auto-i18n.error_missing_key")
					if (typeof langs != "object" || !langs)
						return handled(400, "auto-i18n.error_missing_langs")

					for (const [lang, value] of Object.entries(langs)) {
						if (typeof value != "string") return handled(400, "auto-i18n.error_bad_langs")
					}

					if (canUpdate ? !canUpdate({ category, key, langs }, { event }) : false)
						return handled(403, "auto-i18n.error_access_denied")

					const { error: err } = await safe(async () =>
						update({ category, key, langs }, { event }),
					).asObject()
					if (err) return handled(500, "auto-i18n.error_save_fail")
					else {
						// HACK: just nuke the cache on update
						cache.clear()
						return handled(200, "auto-i18n.update_success")
					}
				} else return { handled: false }
			}

			default:
				return { handled: false }
		}
	}
}

function handled(status: number, data: any): { handled: true; response: Response } {
	const payload = typeof data == "string" ? { message: data } : data
	return { handled: true, response: json(payload, { status }) }
}
