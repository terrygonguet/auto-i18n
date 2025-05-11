# Auto-i18n

## Quoi

`auto-i18n` est une librairie pour [SvelteKit](https://svelte.dev/docs/kit) créée pour vous aider à traduire et localiser votre application.

Contrairement à la plupart des librairies d'i18n, `auto-i18n` stocke les textes de traduction dans une base de données (ou autre type de stockage) au lieu de votre code source. Tout ce que vous avez à faire est d'écrire le code pour accéder et changer ces données.

L'avantage principal de faire les choses de cette façon est qu'il est maintenant possible d'afficher un éditeur visuel directement dans la page, donnant le pouvoir à tout le monde dans votre équipe de modifier les textes, pas seulement les développeurs. Et en bonus vous pouvez stocker les traductions dans le CMS de votre choix, avec le reste de votre contenu.

## Pourquoi

La plupart des solutions d'i18n traitent les textes de traduction comme du code alors que le reste du contenu (comme des blogs) ne le sont pas. Cette pratique a du sens mais cause des situations où réparer un typo prend 2 minutes alors qu'un autre peut prendre des jours ou des semaines car le changement doit être groupé avec la prochaine version de l'app.

Avec `auto-i18n` on peut faire ces modifications à tout moment car ces traductions ne sont plus liées au code, et tout ça avec un éditeur directement dans notre app et tout le contexte nécessaire.

## Comment

La combinaison du tag [`{@html ...}` de Svelte](https://svelte.dev/docs/svelte/@html) et sa [réactivité](https://svelte.dev/docs/svelte/svelte-reactivity#createSubscriber) est le secret de `auto-i18n`. Cela nous permet de faire le chargement automatique facilement. Une fois l'éditeur activé, chaque bout de texte est entouré d'un élément HTML invisible qui nous permet de transmettre le contexte à l'éditeur.

Si tout ça vous intéresse vous pouvez [commencer ici](/docs).
