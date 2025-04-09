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
