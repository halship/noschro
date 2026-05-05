<script lang="ts">
	import { formatLink } from '$lib/formatter';
	import type { NostrToken } from '$lib/models/token';

	type Props = {
		tokens: NostrToken[];
	};

	let { tokens }: Props = $props();
</script>

{#each tokens as token, i (i)}
	{#if token.type === 'text'}
		<span>{token.text}</span>
	{:else if token.type === 'link'}
		<a href={token.url} rel="external" target="_blank" class="underline">{formatLink(token.url)}</a>
	{:else if token.type === 'image'}
		<a href={token.url} rel="external" target="_blank"
			><img src={token.url} class="max-h-80 rounded-md border" alt="content" /></a
		>
	{:else if token.type === 'emoji'}
		<img src={token.url} alt={token.shortcode} class="inline-block size-5" />
	{/if}
{/each}
