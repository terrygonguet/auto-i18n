<script module lang="ts">
	export type EditorOpenRadio = Radio<[category: string, key: string, anchorEl?: HTMLElement]>

	export type EditorCloseRadio = Radio<[], string>

	export interface Props {
		lang?: string
		category?: string
		key?: string
		anchorEl?: HTMLElement
		open: EditorOpenRadio["reciever"]
		close: EditorCloseRadio["reciever"]
		onChange?(): void
	}
</script>

<script lang="ts">
	import { getContext } from "svelte"
	import type { Radio } from "$lib/radio"
	import type { AutoI18N } from "$lib/auto-i18n"

	let { category = "", key = "", anchorEl, open, close, onChange }: Props = $props()
	let dialogEl = $state<HTMLDialogElement>()
	let i18n = getContext<AutoI18N>("i18n")
	let t = $derived(i18n.withDefaults({ editor: false, autoload: false }))
	let targetRect = $derived(
		anchorEl?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2, innerHeight / 3, 0, 0),
	)
	let targetX = $derived(Math.round(targetRect.left + targetRect.width / 2))
	let targetY = $derived(Math.round(targetRect.bottom))

	$effect(() =>
		open((newCategory, newKey, newAnchorEl) => {
			category = newCategory
			key = newKey
			anchorEl = newAnchorEl
			dialogEl?.showModal()
		}),
	)
	$effect(() =>
		close(() => {
			dialogEl?.close()
			return dialogEl?.returnValue ?? ""
		}),
	)

	async function onSubmit(evt: SubmitEvent) {
		evt.preventDefault()
		const data = new FormData(evt.target as HTMLFormElement)
		const { category, key, ...langs } = Object.fromEntries(data)
		const res = await fetch("/locale/all.json", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ category, key, langs }),
		})
		console.log(await res.text())
		dialogEl?.close()
	}
</script>

<dialog
	bind:this={dialogEl}
	style:transform="translate(calc({targetX}px - 50%), calc({targetY}px + 1rem))"
	class="absolute top-0 left-0 border border-stone-300 shadow backdrop:bg-transparent"
>
	<form class="flex flex-col gap-4 p-4" onsubmit={onSubmit}>
		<p class="text-center text-xl"><code>{category}.{key}</code></p>
		<input name="category" value={category} type="hidden" required />
		<input name="key" value={key} type="hidden" required />

		<div class="grid min-w-md grid-cols-[auto_1fr_auto] gap-2">
			{#each i18n.supportedLangs as lang}
				<label for="i18n-editor-value-{lang}"><code>{lang}</code></label>
				<input
					id="i18-editor-value-{lang}"
					name={lang}
					class="border-b border-stone-300 px-1"
					value={i18n.raw(category, key, { lang })}
					placeholder={t("auto-i18n", "value_placeholder", { overrideMissing: "Missing value" })}
				/>
				<div class="flex items-center gap-2 text-sm">
					{#if lang == i18n.lang}
						<span class="text-green-700">
							{t("auto-i18n", "lang_current", { overrideMissing: "Current" })}
						</span>
					{/if}
					{#if lang == i18n.fallbackLang}
						<span class="text-amber-700">
							{t("auto-i18n", "lang_fallback", { overrideMissing: "Fallback" })}
						</span>
					{/if}
				</div>
			{/each}
		</div>
		<button type="submit" class="mx-auto block cursor-pointer border border-stone-500 px-2">
			{t("auto-i18n", "btn_save", { overrideMissing: "Save" })}
		</button>
	</form>
</dialog>
