import { safe } from "@terrygonguet/utils/result"
import { createSubscriber } from "svelte/reactivity"
import type { AutoI18NEditor, AutoI18NEditorConfig } from "./editor.svelte"

export interface AutoI18NConstructorOptions {
	lang: string | (() => string)
	supportedLangs: string[] | (() => string[])
	fallbackLang: string | (() => string)
	preload?: string[]
	fetch: typeof fetch
}

export interface TOptions {
	autoload?: boolean
	editor?: boolean | AutoI18NEditorConfig
	lang?: string
	overrideMissing?: string
	values?: { [name: string]: TValue | undefined }
}

export type TValue =
	| string
	| number
	| boolean
	| { prefix?: string; visible: string | number; suffix?: string }

export class AutoI18N {
	fetch: typeof fetch
	#editor?: AutoI18NEditor
	#editorSubscibe: ReturnType<typeof createSubscriber>
	#editorChange = () => {}

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
			console.warn("[auto-i18n] The fallback language is not in the list of supported languages", {
				fallbackLang: this.#fallbackLang,
				supportedLangs: this.#supportedLangs,
			})

		this.fetch = fetch
		this.#editorSubscibe = createSubscriber((update) => {
			this.#editorChange = update
		})
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
		const [err, data] = await safe(() => this.fetch(`/locale/${lang}/${category}.json`))
			.andThen(async (res) => ({ ok: res.ok, data: await res.json() }))
			.andThen(({ ok, data }) => {
				if (!ok) throw new Error(data.message)
				else return data
			})
			.asTuple()
		this.#inFlight.delete(cacheKey)

		if (err) {
			console.error("[auto-i18n] Failed to load translations", { category, lang }, err)
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
		const [err, data] = await safe(() => this.fetch(url))
			.andThen((res) => res.json())
			.asTuple()
		this.#inFlight.delete("all")
		if (err)
			console.error("[auto-i18n] Failed to load all translations", { categories, langs }, err)

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
		if (this.#lang == lang) return
		const toLoad: string[] = []
		for (const category of this.#loadedCategories) {
			if (!this.#cache.has(lang + "." + category)) toLoad.push(category)
		}
		if (toLoad.length > 0) await this.loadAll({ categories: toLoad, langs: [lang] })
		this.#lang = lang
		this.#langChange()
	}

	get t() {
		return this.translate
	}
	translate(category: string, key: string, options: TOptions = {}): string {
		const {
			autoload = true,
			editor = true,
			lang = this.#lang,
			overrideMissing = "I18N_MISSING_KEY",
			values = {},
		} = options

		this.#cacheSubscribe()
		this.#langSubscribe()
		this.#editorSubscibe()
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
		} else text = this.interpolate(text, values, options)

		return this.#editor && editor
			? this.#editor.renderTranslation(
					text,
					category,
					key,
					values,
					typeof editor == "object" ? editor : undefined,
				)
			: text
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

	static #regex_$t = /^\$t\s+(?<category>\S+)\s+(?<key>\S+)(?:\s(?<lang>\S+))?$/
	static #regex_$match = /^\$match\s+(?<varname>\S+)\s+(?<patterns>.+)$/
	static #regex_$if = /^\$if\s+(?<varname>\S+)\s+(?<true>.+?)(?:\s+\$else\s+(?<false>.+))?$/
	static #regex_base = /^(?<varname>\S+)$/

	interpolate(
		text: string,
		values: NonNullable<TOptions["values"]>,
		options: Pick<TOptions, "autoload" | "lang" | "overrideMissing"> = {},
	) {
		let start = 0
		let end = 0
		let lastEnd = 0
		let result = ""
		while ((start = text.indexOf("{{", lastEnd)) != -1) {
			end = text.indexOf("}}", start)
			if (end == -1) break
			let value = ""
			const expr = text.slice(start + 2, end).trim()

			let match: RegExpExecArray | null = null
			if ((match = AutoI18N.#regex_$t.exec(expr))) {
				const { category, key, lang = this.#lang } = match.groups!
				value = this.t(category, key, { ...options, editor: false, values, lang })
			} else if ((match = AutoI18N.#regex_$match.exec(expr))) {
				const { varname, patterns } = match.groups!
				const matches = Array.from(patterns.matchAll(/(?<amount>[\d_]):/g))
				const rules: { [amount: string]: string } = {}
				for (let i = 0; i < matches.length; i++) {
					const { 0: match, groups, index } = matches[i]
					const { amount } = groups!
					const start = index + match.length
					const end = matches[i + 1]?.index
					const rule = patterns.slice(start, end)
					rules[amount] = rule.trim()
				}

				const tvalue = values[varname]
				let matchResult: string | undefined
				if (tvalue == undefined) {
					console.error(`[auto-i18n] Failed to interpolate $match: missing "${varname}" value`, {
						expression: expr,
						values,
					})
				} else {
					if (typeof tvalue == "object") matchResult = rules[tvalue.visible] ?? rules._
					else matchResult = rules[tvalue.toString()] ?? rules._

					if (matchResult == undefined) {
						console.warn("[auto-i18n] Tried to interpolate a $match without a default case", {
							expression: expr,
							values,
						})
						matchResult = ""
					}

					if (typeof tvalue == "object")
						value = (tvalue.prefix ?? "") + matchResult + (tvalue.suffix ?? "")
					else value = matchResult
				}
			} else if ((match = AutoI18N.#regex_base.exec(expr))) {
				const { varname } = match.groups!
				const tvalue = values[varname]
				if (typeof tvalue == "object")
					value = (tvalue.prefix ?? "") + tvalue.visible + (tvalue.suffix ?? "")
				else if (tvalue != undefined) value = tvalue.toString()
				else
					console.warn("[auto-i18n] Tried to interpolate missing value", {
						expression: expr,
						values,
					})
			} else if ((match = AutoI18N.#regex_$if.exec(expr))) {
				const { varname, true: ifTrue, false: ifFalse = "" } = match.groups!
				const tvalue = values[varname]
				if (typeof tvalue == "object")
					value =
						(tvalue.prefix ?? "") + (tvalue.visible ? ifTrue : ifFalse) + (tvalue.suffix ?? "")
				else if (tvalue != undefined) value = tvalue ? ifTrue : ifFalse
				else
					console.warn("[auto-i18n] Tried to interpolate missing value", {
						expression: expr,
						values,
					})
			} else {
				console.error("[auto-18n] Failed to interpolate: could not understand expression", {
					expression: expr,
					values,
				})
				value = "I18N_INTERPOLATE_ERROR"
			}
			result += text.slice(lastEnd, start) + value
			lastEnd = end + 2
		}
		return result + text.slice(lastEnd)
	}

	get c() {
		return this.content
	}
	content(
		content: string,
		{ editor = true, url }: { editor?: TOptions["editor"]; url?: string } = {},
	) {
		this.#editorSubscibe()
		return this.#editor && editor ? this.#editor.renderContent(content, { url }) : content
	}

	withDefaults(defaultOpts: TOptions): typeof this.t {
		return (category: string, key: string, opts: TOptions = {}) =>
			this.t(category, key, { ...defaultOpts, ...opts })
	}

	get isEditorShown() {
		this.#editorSubscibe()
		return !!this.#editor
	}

	async showEditor({ autoload = false } = {}) {
		if (!this.#editor) {
			const { AutoI18NEditor } = await import("./editor.svelte")
			this.#editor = new AutoI18NEditor(this, { autoload })
			this.#editorChange()
		}
		this.loadAll()
	}

	hideEditor() {
		if (this.#editor) {
			this.#editor.destroy()
			this.#editor = undefined
			this.#editorChange()
		}
	}
}
