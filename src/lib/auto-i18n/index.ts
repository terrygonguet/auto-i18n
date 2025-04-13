import { safe } from "@terrygonguet/utils/result"
import { createSubscriber } from "svelte/reactivity"
import type { AutoI18NEditor } from "$lib/auto-i18n/editor.svelte"

export interface AutoI18NConstructorOptions {
	lang: string | (() => string)
	supportedLangs: string[] | (() => string[])
	fallbackLang: string | (() => string)
	preload?: string[]
	fetch: typeof fetch
}

export interface TOptions {
	autoload?: boolean
	editor?: boolean
	lang?: string
	overrideMissing?: string
	values?: Record<string, TValue>
}

export type TValue =
	| string
	| number
	| { prefix?: string; visible: string | number; suffix?: string }

export class AutoI18N {
	fetch: typeof fetch
	#editor?: AutoI18NEditor

	#lang: string
	#langSubscribe: ReturnType<typeof createSubscriber>
	#langChange = () => {}

	#cache = new Map<string, Record<string, string>>()
	#cacheSubscribe: ReturnType<typeof createSubscriber>
	#cacheChange = () => {}

	#supportedLangs: string[]
	#fallbackLang: string

	#loadedCategories = new Set<string>()
	#failedCategories = new Set<string>()
	#inFlight = new Set<string>()

	constructor({
		lang,
		supportedLangs,
		fallbackLang,
		preload,
		fetch = globalThis.fetch,
	}: AutoI18NConstructorOptions) {
		this.#lang = typeof lang == "string" ? lang : lang()
		this.#supportedLangs = Array.isArray(supportedLangs) ? supportedLangs : supportedLangs()
		this.#fallbackLang = typeof fallbackLang == "string" ? fallbackLang : fallbackLang()
		if (!this.#supportedLangs.includes(this.#fallbackLang))
			console.warn("The auto-i18n fallback language is not in the list of supported languages", {
				fallbackLang: this.#fallbackLang,
				supportedLangs: this.#supportedLangs,
			})

		this.fetch = fetch
		this.#cacheSubscribe = createSubscriber((update) => {
			this.#cacheChange = update
		})
		this.#langSubscribe = createSubscriber((update) => {
			this.#langChange = update
		})

		if (preload) this.loadAll({ categories: preload, langs: [this.#lang, this.#fallbackLang] })
	}

	get lang() {
		this.#langSubscribe()
		return this.#lang
	}

	get supportedLangs() {
		return this.#supportedLangs
	}

	get fallbackLang() {
		return this.#fallbackLang
	}

	async load(category: string, { lang = this.#lang, skipIfCached = false } = {}) {
		const cacheKey = lang + "." + category
		if (
			this.#failedCategories.has(cacheKey) ||
			this.#inFlight.has(cacheKey) ||
			this.#inFlight.has("all") ||
			(skipIfCached && this.#cache.has(cacheKey))
		)
			return

		this.#inFlight.add(cacheKey)
		const [err, data] = await safe(this.fetch(`/locale/${lang}/${category}.json`))
			.andThen(async (res) => ({ ok: res.ok, data: await res.json() }))
			.andThen(({ ok, data }) => {
				if (!ok) throw new Error(data.message)
				else return data
			})
			.asTuple()
		this.#inFlight.delete(cacheKey)

		if (err) {
			console.error("Failed to load translations", { category, lang }, err)
			this.#failedCategories.add(cacheKey)
		} else {
			this.#loadedCategories.add(category)
			this.#cache.set(cacheKey, data)
		}
		this.#cacheChange()
	}

	async loadAll({ categories, langs }: { categories?: string[]; langs?: string[] } = {}) {
		const search = new URLSearchParams()
		if (categories?.length) search.set("categories", categories.join(","))
		if (langs?.length) search.set("langs", langs.join(","))

		this.#inFlight.add("all")
		const url = "/locale/all.json" + (search.size ? "?" + search : "")
		const [err, data] = await safe(this.fetch(url))
			.andThen((res) => res.json())
			.asTuple()
		this.#inFlight.delete("all")
		if (err) console.error("Failed to load all translations", err)

		for (const [lang, categories] of Object.entries<any>(data)) {
			for (const [category, keys] of Object.entries<any>(categories)) {
				const cacheKey = lang + "." + category
				this.#cache.set(cacheKey, keys)
				this.#loadedCategories.add(category)
			}
		}

		this.#cacheChange()
	}

	async setLang(lang: string) {
		await this.loadAll({ categories: Array.from(this.#loadedCategories), langs: [lang] })
		this.#lang = lang
		this.#langChange()
	}

	t(category: string, key: string, options: TOptions = {}): string {
		const {
			autoload = true,
			editor = true,
			lang = this.#lang,
			overrideMissing = "I18N_MISSING_KEY",
			values = {},
		} = options

		this.#cacheSubscribe()
		this.#langSubscribe()
		const cacheKey = lang + "." + category

		const translations = this.#cache.get(cacheKey)
		if (!translations && autoload) this.load(category, { lang })

		let text = translations?.[key]
		if (text == undefined) {
			// 1. wait for the content to load
			if (this.#inFlight.has(cacheKey)) text = ""
			// 2. try fallback lang
			else if (lang != this.#fallbackLang)
				text = this.t(category, key, { ...options, lang: this.#fallbackLang })
			// 3. key is fully missing
			else text = overrideMissing
		} else text = this.interpolate(text, values)

		return this.#editor && editor ? this.#editor.render(text, category, key, values) : text
	}

	raw(
		category: string,
		key: string,
		{ lang = this.#lang, autoload = false }: Pick<TOptions, "lang" | "autoload"> = {},
	) {
		this.#cacheSubscribe()
		const text = this.#cache.get(lang + "." + category)?.[key]
		if (text == undefined && autoload) this.load(category, { lang })
		return text
	}

	interpolate(text: string, values: Record<string, TValue>) {
		let istart = 0
		let iend = 0
		while ((istart = text.indexOf("{{", istart)) != -1) {
			iend = text.indexOf("}}", istart)
			if (iend == -1) break
			const expr = text.slice(istart + 2, iend)
			let value = values[expr] ?? ""
			if (typeof value == "object")
				value = (value.prefix ?? "") + value.visible + (value.suffix ?? "")
			text = text.slice(0, istart) + value + text.slice(iend + 2)
		}
		return text
	}

	withDefaults(defaultOpts: TOptions): typeof this.t {
		return (category: string, key: string, opts: TOptions = {}) =>
			this.t(category, key, { ...defaultOpts, ...opts })
	}

	get isEditorShown() {
		return !!this.#editor
	}

	async showEditor({ autoload = false } = {}) {
		if (!this.#editor) {
			const { AutoI18NEditor } = await import("$lib/auto-i18n/editor.svelte")
			this.#editor = new AutoI18NEditor(this, { autoload })
		}
		this.loadAll()
	}

	hideEditor() {
		if (this.#editor) {
			this.#editor.destroy()
			this.#editor = undefined
			this.#cacheChange()
		}
	}
}
