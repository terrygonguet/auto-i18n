import { db, schema } from "$$/lib/server/db"
import { error, json } from "@sveltejs/kit"
import { safe } from "@terrygonguet/utils/result"
import { sql } from "drizzle-orm"

export const GET = async () => {
	const data = await db.query.translations.findMany({
		columns: { lang: true, category: true, key: true, value: true },
	})

	const obj: { [lang: string]: { [category: string]: { [key: string]: string } } } = {}
	for (const { lang, category, key, value } of data) {
		const objLang = obj[lang] ?? {}
		obj[lang] = objLang
		const objCategory = objLang[category] ?? {}
		objLang[category] = objCategory
		objCategory[key] = value
	}

	return json(obj)
}

export const POST = async ({ request }) => {
	const [parseErr, data] = await safe(() => request.json()).asTuple()
	if (parseErr) {
		console.error(parseErr)
		throw error(400, "auto-i18n.error_bad_input")
	}

	if (typeof data != "object" || data == null || Array.isArray(data))
		throw error(400, "auto-i18n.error_bad_input")

	const { category, key, langs } = data
	if (typeof category != "string" || !category) throw error(400, "auto-i18n.error_missing_category")
	if (typeof key != "string" || !key) throw error(400, "auto-i18n.error_missing_key")
	if (typeof langs != "object" || !langs) throw error(400, "auto-i18n.error_missing_langs")

	const values: (typeof schema.translations.$inferInsert)[] = []
	for (const [lang, value] of Object.entries(langs)) {
		if (typeof value != "string" || !value) throw error(400, "auto-i18n.error_bad_langs")
		values.push({ lang, category, key, value })
	}

	const { error: insertErr } = safe(() =>
		db
			.insert(schema.translations)
			.values(values)
			.onConflictDoUpdate({
				target: [schema.translations.lang, schema.translations.category, schema.translations.key],
				set: { value: sql`excluded.value` },
			})
			.run(),
	).asObject()
	if (insertErr) {
		console.error(insertErr)
		throw error(500, "auto-i18n.error_save_fail")
	}

	return json({ message: "auto-i18n.update_success" })
}
