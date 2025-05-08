import { FALLBACK_LANG, SUPPORTED_LANGS } from "$env/static/private"

const supportedLangs = SUPPORTED_LANGS.split(",")
const fallbackLang = FALLBACK_LANG

export const load = async ({ cookies, request }) => {
	const fromCookies = cookies.get("lang")
	if (fromCookies) return { lang: fromCookies, supportedLangs, fallbackLang }
	else {
		const header = request.headers.get("Accept-Language") ?? ""
		const candidates = header.replaceAll(/\s/g, "").split(",")
		for (const candidate of candidates) {
			const [lang] = candidate.trim().toLowerCase().split(";", 1)
			if (supportedLangs.includes(lang)) return { lang, supportedLangs, fallbackLang }
		}
		return { lang: fallbackLang, supportedLangs, fallbackLang }
	}
}
