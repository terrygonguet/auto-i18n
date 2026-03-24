import { env } from "$env/dynamic/private"
import { redirect } from "@sveltejs/kit"

const supportedLangs = env.SUPPORTED_LANGS?.split(",") ?? ["en"]
const fallbackLang = env.FALLBACK_LANG ?? "en"

export const load = async ({ cookies, request }) => {
	const url = new URL(request.url)
	const forceLang = url.searchParams.get("force-lang")
	if (forceLang && supportedLangs.includes(forceLang)) {
		cookies.set("lang", forceLang, { httpOnly: false, path: "/", expires: new Date(3000, 0, 1) })
		url.searchParams.delete("force-lang")
		redirect(307, url.toString())
	}

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
