<script>
	import "$$/styles.css"
	import { page } from "$app/state"

	let { children } = $props()

	let { i18n, t } = $derived(page.data)
	let segment = $derived(page.route.id)

	$effect(() => void i18n.showEditor())
</script>

<header class="border-b border-stone-300 bg-stone-100 text-2xl">
	<nav class="p-8">
		<ul class="flex justify-center">
			<li>
				<a href="/" class="p-6" class:underline={segment == "/"}>
					{@html t("nav", "link_home")}
				</a>
			</li>
			<li>
				<a href="/test" class="p-6" class:underline={segment == "/test"}>
					{@html t("nav", "link_test")}
				</a>
			</li>
			<li>
				<a href="/docs" class="p-6" class:underline={segment == "/docs"}>
					{@html t("nav", "link_docs")}
				</a>
			</li>
			<li>
				<a href="/about" class="p-6" class:underline={segment == "/about"}>
					{@html t("nav", "link_about")}
				</a>
			</li>
		</ul>
	</nav>
</header>
{@render children()}
<footer class="flex items-center justify-center gap-6 border-t border-stone-300 bg-stone-100 p-10">
	<p>
		By <a href="https://terry.gonguet.com" target="_blank" class="text-amber-700 underline"
			>Terry Gonguet</a
		> 2025
	</p>
	<button onclick={() => i18n.showEditor()}>{@html t("footer", "show_editor")}</button>
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
