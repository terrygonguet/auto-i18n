# Auto-i18n

## What

`auto-i18n` is a [SvelteKit](https://svelte.dev/docs/kit) library to help you translate and localize your app.

Unlike most i18n libraries, `auto-i18n` stores translation strings in a database (or storage of some kind) instead of your source code. All you have to provide is the code to get and update that data.

The main advantage of doing it that way is that we can now display an in-page editor so that anyone in your team can make changes, not just developers. And as a bonus you can store your translations strings in your CMS of choice, next to the rest of your content.

## Why

Most i18n solutions treat your translation strings as code but the content (like blog posts) is not. This makes some sense but leads to situations where changing a typo in one place takes 2 minutes but another one takes days or weeks because it has to be bundled into next release.

With `auto-i18n`, because our translation strings aren't tied to code releases anymore we can edit them at any time with a cool editor, right in our app with all the context we need.

## How

The special sauce for `auto-i18n` are [Svelte's `{@html ...}` tag](https://svelte.dev/docs/svelte/@html) and [reactivity](https://svelte.dev/docs/svelte/svelte-reactivity#createSubscriber). First off they allow us first to do easy auto loading of strings. Then, once you activate the editor, every string is wrapped in an invisible HTML element that allows a rich editor UI.

If you're interested, you can [get started here](/docs)!
