<script lang="ts">
	import { getContext } from "svelte"
	import type { AutoI18N } from "@terrygonguet/auto-i18n"

	interface Props {
		autoload?: boolean
		url?: string
	}

	let { autoload = false, url }: Props = $props()

	let i18n = getContext<AutoI18N>("i18n")
	let t = $derived(i18n.withDefaults({ editor: false, autoload }))
</script>

<div id="i18n-editor-content">
	<p>
		{t("auto-i18n", "external_content", {
			overrideMissing: "This text is external content not managed by Auto-i18n.",
		})}
	</p>
	{#if url}
		<p id="i18n-editor-content-url">
			<a href={url} target="_blank">
				{t("auto-i18n", "content_url", { overrideMissing: "View content" })}
			</a>
		</p>
	{/if}
</div>

<style>
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
</style>
