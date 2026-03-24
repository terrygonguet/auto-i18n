<script lang="ts">
	import "$$/styles.css"
	import { page } from "$app/state"
	import iconSrc from "$assets/icon.svg"
	import globeSrc from "$assets/globe.svg"
	import type { LayoutData } from "./$types.js"
	import { invalidate } from "$app/navigation"

	let { children } = $props()

	let { i18n, t } = $derived(page.data) as LayoutData
	let segment = $derived(page.route.id)

	function onLangChange(lang: string) {
		i18n.setLang(lang)
		const expires = new Date(3000, 0, 1)
		document.cookie = `lang=${lang};expires=${expires.toUTCString()}`
		invalidate((url) => url.protocol == "content:")
	}

	function onKeydown(evt: KeyboardEvent) {
		if (evt.code == "Backslash" && evt.ctrlKey && evt.shiftKey) {
			if (i18n.isEditorShown) i18n.hideEditor()
			else i18n.showEditor()
		}
	}
</script>

<svelte:body onkeydown={onKeydown} />

<header class="border-b border-stone-300 bg-stone-100 text-2xl">
	<nav class="p-8">
		<ul class="flex justify-center" role="list">
			<li>
				<a href="/" class="flex items-center gap-2 p-6" class:underline={segment == "/"}>
					<img class="h-7" src={iconSrc} aria-hidden="true" alt="🖍" />
					{@html t("nav", "link_home")}
				</a>
			</li>
			<li>
				<a href="/docs" class="block p-6" class:underline={segment == "/docs"}>
					{@html t("nav", "link_docs")}
				</a>
			</li>
		</ul>
	</nav>
</header>

{@render children()}

<footer class="flex items-center justify-center gap-6 border-t border-stone-300 bg-stone-100 p-10">
	<p>
		{@html t("footer", "made_by", {
			values: {
				name: {
					prefix: `<a href="https://terry.gonguet.com" target="_blank" class="text-teal-700 underline">`,
					visible: "Terry Gonguet",
					suffix: "</a>",
				},
				year: "2025",
			},
		})}
	</p>

	<p class="flex items-center gap-2">
		<img class="h-5" src={globeSrc} alt="Globe icon" />
		<select bind:value={() => i18n.lang, onLangChange} class="border border-teal-500 px-1 py-0.5">
			{#each i18n.supportedLangs as lang}
				<option value={lang}>{@html t("general", "langlang_" + lang, { editor: false })}</option>
			{/each}
		</select>
	</p>
</footer>

<style>
	:global(body) {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr auto;
		grid-template-areas: "header" "main" "footer";
		height: 100%;

		header {
			grid-area: header;
		}

		:global(main) {
			grid-area: main;
		}

		footer {
			grid-area: footer;
		}
	}
</style>
