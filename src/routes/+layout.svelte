<script>
	import "../styles.css"
	import { page } from "$app/state"

	let { children } = $props()

	let segment = $derived(page.route.id)
</script>

<header class="border-b border-stone-300 bg-stone-100 text-2xl">
	<nav class="p-8">
		<ul class="flex justify-center">
			<li><a href="/" class="p-6" class:underline={segment == "/"}>Home</a></li>
			<li><a href="/test" class="p-6" class:underline={segment == "/test"}>Test page</a></li>
			<li><a href="/docs" class="p-6" class:underline={segment == "/docs"}>Docs</a></li>
			<li><a href="/about" class="p-6" class:underline={segment == "/about"}>About</a></li>
		</ul>
	</nav>
</header>
{@render children()}
<footer class="border-t border-stone-300 bg-stone-100 p-10 text-center">
	<p>
		By <a href="https://terry.gonguet.com" target="_blank" class="text-amber-700 underline"
			>Terry Gonguet</a
		> 2025
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
