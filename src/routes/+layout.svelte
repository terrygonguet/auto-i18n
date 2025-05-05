<script lang="ts">
	import "$$/styles.css"
	import { page } from "$app/state"
	import iconSrc from "$assets/icon.svg"
	import type { PageData } from "./$types.js"

	let { children } = $props()

	let { i18n, t } = $derived(page.data) as PageData
	let segment = $derived(page.route.id)

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
