import { i18nHandler } from "$minilib/i18n/index.js"
import { redirect } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"

export const handle = sequence(i18nHandler, ({ event, resolve }) => {
	if (event.url.pathname == "/favicon.ico") redirect(308, "/favicon.svg")
	else return resolve(event)
})
