import { command, getRequestEvent, query } from "$app/server"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import {
	error,
	type Handle,
	type RemoteCommand,
	type RemoteQueryFunction,
	type RequestEvent,
} from "@sveltejs/kit"
import { safe } from "@terrygonguet/utils/result"

type MaybePromise<T> = T | Promise<T>

export type TranslationCategory = { [key: string]: string }
export type TranslationLanguage = { [category: string]: TranslationCategory }
export type Translations = { [lang: string]: TranslationLanguage }

export interface CreateSvelteI18NServerBundleOptions {
	getLang?(event: RequestEvent): MaybePromise<string>

	fetchCategory(options: {
		where: { lang: string; category: string }
		event: RequestEvent
	}): MaybePromise<TranslationCategory | undefined>
	canFetchCategory?(options: {
		where: { lang: string; category: string }
		event: RequestEvent
	}): MaybePromise<boolean>

	fetchAll(options: {
		where: { langs?: string[]; categories?: string[] }
		event: RequestEvent
	}): MaybePromise<Translations | undefined>
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

export interface SvelteI18NServerBundle {
	fetchCategory: RemoteQueryFunction<{ lang: string; category: string }, TranslationCategory>
	fetchAll: RemoteQueryFunction<{ langs?: string[]; categories?: string[] }, Translations>
	update: RemoteCommand<{ category: string; key: string; langs: { [lang: string]: string } }, void>
	handle: Handle
}

export function createSvelteI18NServerBundle({
	getLang,
	fetchCategory,
	canFetchCategory,
	fetchAll,
	canFetchAll,
	update,
	canUpdate,
}: CreateSvelteI18NServerBundleOptions): SvelteI18NServerBundle {
	//! HACK: stringified `where` is the key and the full response object is the value
	const cache = new Map<string, any>()
	return {
		fetchCategory: query(fetchCategoryValidator, async ({ lang, category }) => {
			const event = getRequestEvent()
			if (canFetchCategory ? !canFetchCategory({ where: { lang, category }, event }) : false)
				error(403, "svelte-i18n.error_access_denied")

			const cacheKey = JSON.stringify({ lang, category })
			const cached = cache.get(cacheKey)
			if (cached) return cached

			const [err, data] = await safe(async () =>
				fetchCategory({ where: { lang, category }, event }),
			).asTuple()
			if (err) error(500, "svelte-i18n.error_get_fail")
			else if (!data) error(404, "svelte-i18n.error_not_found")
			else {
				cache.set(cacheKey, data)
				return data
			}
		}),
		fetchAll: query(fetchAllValidator, async ({ langs, categories }) => {
			const event = getRequestEvent()
			if (canFetchAll ? !canFetchAll({ where: { langs, categories }, event }) : false)
				error(403, "svelte-i18n.error_access_denied")

			const cacheKey = JSON.stringify({ langs, categories })
			const cached = cache.get(cacheKey)
			if (cached) return cached

			const [err, data] = await safe(async () =>
				fetchAll({ where: { categories, langs }, event }),
			).asTuple()
			if (err) error(500, "svelte-i18n.error_get_fail")
			else if (!data) error(404, "svelte-i18n.error_not_found")
			else {
				cache.set(cacheKey, data)
				return data
			}
		}),
		update: command(updateValidator, async ({ category, key, langs }) => {
			const event = getRequestEvent()
			if (canUpdate ? !canUpdate({ category, key, langs }, { event }) : false)
				error(403, "svelte-i18n.error_access_denied")

			const { error: err } = await safe(async () =>
				update({ category, key, langs }, { event }),
			).asObject()
			if (err) error(503, "svelte-i18n.error_save_fail")
			//! HACK: just nuke the cache on update
			else cache.clear()
		}),
		async handle({ event, resolve }) {
			if (!getLang) return resolve(event)
			const lang = await getLang(event)
			return resolve(event, {
				transformPageChunk({ html }) {
					return html.replaceAll("%svelte-i18n.lang%", lang)
				},
			})
		},
	}
}

const fetchCategoryValidator: StandardSchemaV1<{
	lang: string
	category: string
}> = {
	"~standard": {
		version: 1,
		vendor: "@terrygonguet/svelte-i18n",
		validate(value) {
			if (typeof value != "object" || value == null || Array.isArray(value))
				return { issues: [{ message: "svelte-i18n.error_bad_input" }] }

			const issues: StandardSchemaV1.Issue[] = []
			const { category, lang } = value as Record<string, unknown>
			if (typeof lang != "string" || !lang)
				issues.push({ message: "svelte-i18n.error_missing_lang", path: ["lang"] })
			if (typeof category != "string" || !category)
				issues.push({ message: "svelte-i18n.error_missing_category", path: ["category"] })

			if (issues.length) return { issues }
			else return { value: { category: category as string, lang: lang as string } }
		},
	},
}

const fetchAllValidator: StandardSchemaV1<{
	langs?: string[]
	categories?: string[]
}> = {
	"~standard": {
		version: 1,
		vendor: "@terrygonguet/svelte-i18n",
		validate(value) {
			if (typeof value != "object" || value == null || Array.isArray(value))
				return { issues: [{ message: "svelte-i18n.error_bad_input" }] }

			const issues: StandardSchemaV1.Issue[] = []
			const { categories, langs } = value as Record<string, unknown>
			if (langs !== undefined) {
				if (typeof langs != "object" || !Array.isArray(langs))
					issues.push({ message: "svelte-i18n.error_langs_not_array", path: ["langs"] })
				else {
					for (const [i, lang] of langs.entries()) {
						if (typeof lang != "string" || !lang)
							issues.push({ message: "svelte-i18n.error_bad_lang", path: ["langs", i] })
					}
				}
			}

			if (categories !== undefined) {
				if (typeof categories != "object" || !Array.isArray(categories))
					issues.push({ message: "svelte-i18n.error_categories_not_array", path: ["categories"] })
				else {
					for (const [i, lang] of categories.entries()) {
						if (typeof lang != "string" || !lang)
							issues.push({ message: "svelte-i18n.error_bad_category", path: ["categories", i] })
					}
				}
			}

			if (issues.length) return { issues }
			else return { value: { categories: categories as string[], langs: langs as string[] } }
		},
	},
}

const updateValidator: StandardSchemaV1<{
	category: string
	key: string
	langs: { [lang: string]: string }
}> = {
	"~standard": {
		version: 1,
		vendor: "@terrygonguet/svelte-i18n",
		validate(value) {
			if (typeof value != "object" || value == null || Array.isArray(value))
				return { issues: [{ message: "svelte-i18n.error_bad_input" }] }

			const issues: StandardSchemaV1.Issue[] = []
			const { category, key, langs } = value as Record<string, unknown>
			if (typeof category != "string" || !category)
				issues.push({ message: "svelte-i18n.error_missing_category", path: ["category"] })
			if (typeof key != "string" || !key)
				issues.push({ message: "svelte-i18n.error_missing_key", path: ["key"] })
			if (typeof langs != "object" || !langs)
				issues.push({ message: "svelte-i18n.error_missing_langs", path: ["langs"] })
			else {
				for (const lang of Object.values(langs)) {
					if (typeof lang != "string" || !lang)
						issues.push({ message: "svelte-i18n.error_bad_lang", path: ["langs", lang] })
				}
			}

			if (issues.length) return { issues }
			else
				return {
					value: {
						category: category as string,
						key: key as string,
						langs: { ...(langs as Record<string, string>) },
					},
				}
		},
	},
}
