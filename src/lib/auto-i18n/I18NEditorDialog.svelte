<script module lang="ts">
	export interface Props {
		lang: string
		category: string
		key: string
		value: string
		open: Radio["reciever"]
		close: Radio["reciever"]
	}
</script>

<script lang="ts">
	import { applyAction, enhance } from "$app/forms"
	import { page } from "$app/state"
	import type { SubmitFunction } from "@sveltejs/kit"
	import type { PageProps } from "$routes/locale/[lang]/[category].json/$types"
	import type { Radio } from "$lib/radio"

	let { lang, category, key, value, open, close }: Props = $props()
	let { form } = $derived<PageProps>(page)
	let dialogEl = $state<HTMLDialogElement>()

	$effect(() => open(() => dialogEl?.showModal()))
	$effect(() => close(() => dialogEl?.close()))

	const submitFn: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result)
			dialogEl?.close()
		}
	}
</script>

<dialog bind:this={dialogEl}>
	<form method="POST" action="/{lang}/{category}.json" use:enhance={submitFn}>
		<p>Category: <code>{category}</code> / Key: <code>{form?.key ?? key}</code></p>
		<input id="i18-editor-key" name="key" value={form?.key ?? key} type="hidden" required />
		<label for="i18n-editor-value">Value</label>
		<input id="i18-editor-value" name="value" value={form?.value ?? value} type="text" required />
		<button type="submit">Save</button>
	</form>
</dialog>
