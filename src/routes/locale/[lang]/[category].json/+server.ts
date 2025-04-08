import { db } from "$lib/server/db"
import { schema } from "$lib/server/db"
import { error, json } from "@sveltejs/kit"

export const GET = async ({ params }) => {
	const pairs = await db.query.translations.findMany({
		columns: { key: true, value: true },
		where: (table, { and, eq }) =>
			and(eq(table.lang, params.lang), eq(table.category, params.category)),
	})

	if (pairs.length == 0) throw error(404, "auto-i18n.error_not_found")

	const obj = pairs.reduce(
		(acc, { key, value }) => {
			acc[key] = value
			return acc
		},
		{} as Record<string, string>,
	)
	return json(obj)
}

export const POST = async ({ params, request }) => {
	const data = await request.json()

	if (typeof data != "object" || Array.isArray(data) || data == null)
		throw error(400, "auto-i18n.error_not_an_object")
	if (typeof data.key != "string") throw error(400, "auto-i18n.error_missing_key")
	if (typeof data.value != "string") throw error(400, "auto-i18n.error_missing_value")

	await db
		.insert(schema.translations)
		.values({ lang: params.lang, category: params.category, key: data.key, value: data.value })
		.onConflictDoUpdate({
			target: [schema.translations.lang, schema.translations.category, schema.translations.key],
			set: { value: data.value },
		})

	return json({ message: "auto-i18n.update_success" })
}
