<script module lang="ts">
	export type EditorOpenRadio = Radio<
		[
			| {
					type: "translation"
					category: string
					key: string
					values: NonNullable<TOptions["values"]>
					multiline: boolean
					anchorEl?: HTMLElement
			  }
			| { type: "content"; url?: string },
		]
	>

	export type EditorCloseRadio = Radio<[], string>

	export interface Props {
		autoload?: boolean
		open: EditorOpenRadio["reciever"]
		close: EditorCloseRadio["reciever"]
		onChange?(): void
	}
</script>

<script lang="ts">
	import { getContext, tick, untrack } from "svelte"
	import type { Radio } from "./radio.js"
	import { type TOptions, type AutoI18N } from "./index.js"
	import { safe } from "@terrygonguet/utils/result"

	let { autoload = false, open, close, onChange }: Props = $props()

	let i18n = getContext<AutoI18N>("i18n")
	let t = $derived(i18n.withDefaults({ editor: false, autoload }))

	type Mode =
		| {
				type: "translation"
				category: string
				key: string
				values: NonNullable<TOptions["values"]>
				multiline?: { selected: string }
		  }
		| { type: "content"; url?: string }

	let mode = $state<Mode>({ type: "content" })
	let dialogEl = $state<HTMLDialogElement>()!

	let anchorEl = $state<HTMLElement>()
	let scrollY = $state(0)
	let targetRect = $derived(
		anchorEl
			? getChildrenBoundingRect(anchorEl)
			: new DOMRect(innerWidth / 2, innerHeight / 3, 0, 0),
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
		open((args) => {
			switch (args.type) {
				case "translation":
					anchorEl = args.anchorEl
					mode = {
						type: "translation",
						category: args.category,
						key: args.key,
						values: args.values,
						multiline: args.multiline ? { selected: i18n.lang } : undefined,
					}
					tick().then(() => dialogEl.showModal())
					break
				case "content":
					mode = { type: "content", url: args.url }
					tick().then(() => dialogEl.showModal())
					break
			}
		}),
	)
	$effect(() =>
		close(() => {
			dialogEl.close()
			return dialogEl.returnValue ?? ""
		}),
	)

	function getChildrenBoundingRect(element: HTMLElement) {
		const range = document.createRange()
		range.selectNode(element)
		return range.getBoundingClientRect()
	}

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

	function onLabelClick(multiline: { selected: string }, lang: string) {
		return function () {
			multiline.selected = lang
			tick().then(() =>
				document.querySelector<HTMLTextAreaElement>("#i18n-editor-value-" + lang)?.focus(),
			)
		}
	}
</script>

<svelte:window bind:scrollY />

<div id="i18n-editor-on-sign"></div>

<dialog bind:this={dialogEl} id="i18n-editor" style:transform onclick={onDialogClick}>
	{#if mode.type == "translation"}
		{@const { category, key, values, multiline } = mode}
		{@const hasValues = Object.keys(values).length > 0}
		<form onsubmit={onSubmit}>
			<p id="i18n-editor-title"><code>{category}.{key}</code></p>
			<input name="category" value={category} type="hidden" required />
			<input name="key" value={key} type="hidden" required />

			{#if hasValues}
				<div id="i18n-editor-values">
					<p class="i18n-editor-subtitle">
						{t("auto-i18n", "title_values", { overrideMissing: "Values" })}
					</p>
					{#each Object.entries(values) as [name, value]}
						<code class="i18n-editor-values-name">{"{{" + name + "}}"}</code>
						<span>:</span>
						<span class="i18n-editor-values-value">
							{typeof value == "object" ? value.visible : value}
						</span>
					{/each}
				</div>
			{/if}

			{#if multiline}
				<div>
					{#if hasValues}
						<p class="i18n-editor-subtitle">
							{t("auto-i18n", "title_translations", { overrideMissing: "Translations" })}
						</p>
					{/if}
					<div id="i18n-editor-multiline">
						<div id="i18n-editor-multiline-tabs">
							{#each i18n.supportedLangs as lang}
								<button
									type="button"
									id="i18n-editor-label-{lang}"
									class="i18n-editor-multiline-tab"
									data-selected={lang == multiline.selected}
									onclick={onLabelClick(multiline, lang)}
								>
									<code>{lang}</code>
									{@render langIndicators(i18n, t, lang)}
								</button>
							{/each}
							<div id="i18n-editor-multiline-tabend"></div>
						</div>
						{#each i18n.supportedLangs as lang}
							{@const placeholder = t("auto-i18n", "value_placeholder", {
								overrideMissing: "Missing value",
							})}
							<!-- svelte-ignore a11y_autofocus -->
							<textarea
								name={lang}
								id="i18n-editor-value-{lang}"
								class="i18n-editor-multiline-value"
								aria-labelledby="i18n-editor-label-{lang}"
								data-selected={lang == multiline.selected}
								autofocus
								rows="5"
								{placeholder}>{i18n.raw(category, key, { lang })}</textarea
							>
						{/each}
					</div>
				</div>
			{:else}
				<div id="i18n-editor-monoline">
					{#if hasValues}
						<p class="i18n-editor-subtitle">
							{t("auto-i18n", "title_translations", { overrideMissing: "Translations" })}
						</p>
					{/if}
					{#each i18n.supportedLangs as lang}
						<label for="i18n-editor-value-{lang}"><code>{lang}</code></label>
						<input
							id="i18-editor-value-{lang}"
							class="i18n-editor-monoline-value"
							name={lang}
							value={i18n.raw(category, key, { lang })}
							placeholder={t("auto-i18n", "value_placeholder", {
								overrideMissing: "Missing value",
							})}
						/>
						<div id="i18n-editor-monoline-indicators">{@render langIndicators(i18n, t, lang)}</div>
					{/each}
				</div>
			{/if}

			<button type="submit" id="i18n-editor-save">
				{t("auto-i18n", "btn_save", { overrideMissing: "Save" })}
			</button>
		</form>
	{:else if mode.type == "content"}
		{@const { url } = mode}
		<div id="i18n-editor-content">
			<p>
				{@html t("auto-i18n", "external_content", {
					overrideMissing: "This text is external content not managed by Auto-i18n.",
				})}
			</p>
			{#if url}
				<p id="i18n-editor-content-url">
					<a href={url} target="_blank">
						{@html t("auto-i18n", "content_url", { overrideMissing: "View content" })}
					</a>
				</p>
			{/if}
		</div>
	{/if}
</dialog>

{#snippet langIndicators(i18n: AutoI18N, t: AutoI18N["t"], lang: string)}
	{#if lang == i18n.lang}
		{@const label = t("auto-i18n", "lang_current", { overrideMissing: "Current" })}
		<span class="i18n-editor-indicator-cur" title={label}>{label.charAt(0)}</span>
	{/if}
	{#if lang == i18n.fallbackLang}
		{@const label = t("auto-i18n", "lang_fallback", { overrideMissing: "Fallback" })}
		<span class="i18n-editor-indicator-fb" title={label}>{label.charAt(0)}</span>
	{/if}
{/snippet}

<style>
	:global(.i18n-fragment) {
		display: contents;
	}

	#i18n-editor-on-sign {
		--i18n-editor-sign-border-color: oklch(70.4% 0.14 182.503);
		--i18n-editor-sign-border-width: 8px;

		pointer-events: none;
		position: fixed;
		inset: 0;
		z-index: 50;
		border: var(--i18n-editor-sign-border-width) solid var(--i18n-editor-sign-border-color);
	}

	dialog#i18n-editor {
		--i18n-editor-dialog-border-color: oklch(85.5% 0.138 181.071);
		--i18n-editor-dialog-backdrop: oklch(98.4% 0.014 180.72 / 50%);
		--i18n-editor-title-bg: oklch(95.3% 0.051 180.801);
		--i18n-editor-save-bg: oklch(95.3% 0.051 180.801);
		--i18n-editor-save-bg-hover: oklch(98.4% 0.014 180.72);
		--i18n-editor-content-url-color: oklch(51.1% 0.096 186.391);
		--i18n-editor-indicator-current: oklch(51.1% 0.096 186.391);
		--i18n-editor-indicator-fallback: oklch(45.7% 0.24 277.023);
		--i18n-editor-font-mono:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
			monospace;

		position: absolute;
		top: 0;
		left: 0;
		border: 1px solid var(--i18n-editor-dialog-border-color);
	}
	dialog#i18n-editor::backdrop {
		background-color: var(--i18n-editor-dialog-backdrop);
	}

	dialog#i18n-editor > form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		min-width: 28rem;
	}

	#i18n-editor-title {
		text-align: center;
		font-size: 1.25rem;

		> code {
			border-radius: 0.25rem;
			padding: 0.25rem 0.5rem;
			background-color: var(--i18n-editor-title-bg);
		}
	}

	.i18n-editor-subtitle {
		grid-column: span 3;
		text-align: center;
		text-decoration: underline;
		text-decoration-color: var(--i18n-editor-dialog-border-color);
	}

	#i18n-editor-values {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 0.5rem;
		width: 100%;
	}
	.i18n-editor-values-name {
		text-align: end;
	}
	.i18n-editor-values-value {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	#i18n-editor-multiline {
		display: grid;
	}
	#i18n-editor-multiline-tabs {
		display: flex;
	}

	.i18n-editor-multiline-tab {
		border: 1px solid var(--i18n-editor-dialog-border-color);
		border-inline-end: 0;
		padding: 0.25rem 0.5rem;

		&[data-selected="true"] {
			border-block-end: 0;
		}
	}

	#i18n-editor-multiline-tabend {
		flex: 1;
		border: 1px solid var(--i18n-editor-dialog-border-color);
		border-block-start: 0;
		border-inline-end: 0;
	}

	.i18n-editor-multiline-value {
		padding: 0.75rem;
		grid-column: 1;
		grid-row: 2;
		font-family: var(--i18n-editor-font-mono);
		border: 1px solid var(--i18n-editor-dialog-border-color);
		border-block-start: 0;
		outline: none;

		&[data-selected="false"] {
			display: none;
		}
	}

	#i18n-editor-monoline {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.5rem;
	}

	.i18n-editor-monoline-value {
		padding-inline: 0.25rem;
		border-block-end: 1px solid var(--i18n-editor-dialog-border-color);
		font-family: var(--i18n-editor-font-mono);
	}

	#i18n-editor-monoline-indicators {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	#i18n-editor-save {
		display: block;
		padding-inline: 0.5rem;
		margin-inline: auto;
		cursor: pointer;
		border: 1px solid var(--i18n-editor-dialog-border-color);
		background-color: var(--i18n-editor-save-bg);
		transition: background-color 0.15s ease-in-out;

		&:is(:hover, :active) {
			background-color: var(--i18n-editor-save-bg-hover);
		}
	}

	#i18n-editor-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		max-width: 65ch;
	}

	#i18n-editor-content-url {
		text-align: center;

		> a {
			color: var(--i18n-editor-content-url-color);
			text-decoration: underline;
		}
	}

	.i18n-editor-indicator-cur {
		color: var(--i18n-editor-indicator-current);
		font-size: 0.875rem;
	}
	.i18n-editor-indicator-fb {
		color: var(--i18n-editor-indicator-fallback);
		font-size: 0.875rem;
	}
</style>
