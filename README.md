# ![temp icon](/static/favicon.svg) `@terrygonguet/auto-i18n`

This is an experimental way of doing i18n in [Svelte](https://svelte.dev/docs/svelte/overview) 5, focusing on [DX](https://en.wikipedia.org/wiki/User_experience#Developer_experience) and ease of editing. Performance and low bandwidth usage are sub goals as well.

## Why

Source data for translations is usually considered part of the source code for an app. This allows us to version it easily and even [type check it](https://github.com/ivanhofer/typesafe-i18n).

However this makes changing translations very hard to non-developpers and clashes with the user-friendliness of most CMSes. Why is it easy to fix a typo in a blog post but you have to file a bug report for a typo in the footer?

This project asks "what if we could make editing translations end-user-friendly as well?"

## How

We use Svelte's `{@html ...}` [tag](https://svelte.dev/docs/svelte/@html) for every string so that when the editor is open we can replace the text with an element (like a `<div>` or a `<span>` with `display: contents`), allowing the end-user to simply click on the displayed text to edit it.

Every translation string has a _category_ (unit of loading) and a _key_ that identifies it. During SSR, SvelteKit automagically intercepts the queries and bundles the responses in the HTML sent to the client, allowing for fully localized pre-rendering without redundant requests when hydrating the page.

On the server side, we expose a function to expose the API paths the client side expects and interface with your storage solution. You then simply call that function in the `handle` [hook](https://svelte.dev/docs/kit/hooks#Server-hooks-handle).

## What

This project is extremely early and experimental, everything can and will change frequently.

Some documentation and examples are available at [auto-i18n.gonguet.com](http://auto-i18n.gonguet.com).
