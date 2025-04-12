<script module lang="ts">
	export type EditorOpenRadio = Radio<
		[category: string, key: string, values: Record<string, string | number>, anchorEl?: HTMLElement]
	>

	export type EditorCloseRadio = Radio<[], string>

	export interface Props {
		category?: string
		key?: string
		values?: Record<string, string | number>
		anchorEl?: HTMLElement
		open: EditorOpenRadio["reciever"]
		close: EditorCloseRadio["reciever"]
		onChange?(): void
	}
</script>

<script lang="ts">
	import { getContext, tick, untrack } from "svelte"
	import type { Radio } from "$lib/radio"
	import type { AutoI18N } from "$lib/auto-i18n"
	import { safe } from "@terrygonguet/utils/result"

	let { category = "", key = "", values = {}, anchorEl, open, close, onChange }: Props = $props()

	let i18n = getContext<AutoI18N>("i18n")
	let t = $derived(i18n.withDefaults({ editor: false, autoload: false }))

	let scrollY = $state(0)

	let hasValues = $derived(Object.keys(values).length > 0)

	let dialogEl = $state<HTMLDialogElement>()!
	let targetRect = $derived(
		anchorEl?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2, innerHeight / 3, 0, 0),
	)
	let placementMode: "under" | "above" = $derived(
		targetRect.top > innerHeight / 2 ? "above" : "under",
	)
	let targetX = $derived(Math.round(targetRect.left + targetRect.width / 2))
	let targetY = $derived(
		Math.round(
			untrack(() => scrollY) + (placementMode == "above" ? targetRect.top : targetRect.bottom),
		),
	)
	let transform = $derived(
		placementMode == "under"
			? `translate(calc(${targetX}px - 50%), calc(${targetY}px + 1rem))`
			: `translate(calc(${targetX}px - 50%), calc(${targetY}px - 100% - 1rem))`,
	)

	$effect(() =>
		open((newCategory, newKey, newValues, newAnchorEl) => {
			category = newCategory
			key = newKey
			values = newValues
			anchorEl = newAnchorEl
			tick().then(() => dialogEl.showModal())
		}),
	)
	$effect(() =>
		close(() => {
			dialogEl.close()
			return dialogEl.returnValue ?? ""
		}),
	)

	async function onSubmit(evt: SubmitEvent) {
		evt.preventDefault()

		const data = new FormData(evt.target as HTMLFormElement)
		const { category, key, ...langs } = Object.fromEntries(data)
		const [err, response] = await safe(() =>
			fetch("/locale/all.json", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ category, key, langs }),
			}),
		)
			.andThen((res) => res.json())
			.asTuple()

		if (err) console.error(err)
		else if (
			response &&
			typeof response == "object" &&
			response.message == "auto-i18n.update_success"
		) {
			i18n.loadAll().then(() => onChange?.())
			dialogEl.close()
		}
	}

	function onDialogClick(evt: Event) {
		if (evt.target == evt.currentTarget) dialogEl.close()
	}
</script>

<svelte:window bind:scrollY />

<dialog
	bind:this={dialogEl}
	style:transform
	class="absolute top-0 left-0 border border-stone-300 shadow backdrop:bg-transparent"
	onclick={onDialogClick}
>
	<form class="flex w-min flex-col gap-4 p-4" onsubmit={onSubmit}>
		<p class="text-center text-xl"><code>{category}.{key}</code></p>
		<input name="category" value={category} type="hidden" required />
		<input name="key" value={key} type="hidden" required />

		{#if hasValues}
			<div class="grid w-full grid-cols-[auto_1fr] gap-2">
				<p class="col-span-2 text-center underline">
					{t("auto-i18n", "title_values", { overrideMissing: "Values" })}
				</p>
				{#each Object.entries(values) as [name, value]}
					<span>{name}</span>
					<code class="overflow-hidden overflow-ellipsis whitespace-nowrap">{value}</code>
				{/each}
			</div>
		{/if}

		<div class="grid min-w-md grid-cols-[auto_1fr_auto] gap-2">
			{#if hasValues}
				<p class="col-span-3 text-center underline">
					{t("auto-i18n", "title_translations", { overrideMissing: "Translations" })}
				</p>
			{/if}
			{#each i18n.supportedLangs as lang}
				<label for="i18n-editor-value-{lang}"><code>{lang}</code></label>
				<input
					id="i18-editor-value-{lang}"
					name={lang}
					class="border-b border-stone-300 px-1 font-mono"
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
