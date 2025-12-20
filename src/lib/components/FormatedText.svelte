<script lang="ts">
	import { tokenize } from '$lib/formatter';
	import { Emoji, Space, Text } from '$lib/types/token';
	import { getEmojis, getSetting } from '$lib/util';

	let {
		text,
		emojis
	}: {
		text: string;
		emojis: Record<string, string>;
	} = $props();

	let tokens = $derived(tokenize(text));
	let loadImage = getSetting('load-image') === 'true';
</script>

{#each tokens as token}
	{#if token instanceof Text}
		<span>{token.value}</span>
	{:else if token instanceof Space}
		{#if token.kind === 'half'}
			&nbsp;
		{:else}
			&emsp;
		{/if}
	{:else if token instanceof Emoji}
		{#if loadImage && token.code in emojis}
			<img src={emojis[token.code]} alt="emoji" class="inline-block max-h-[1.2em]" />
		{:else}
			:{token.code}:
		{/if}
	{/if}
{/each}
