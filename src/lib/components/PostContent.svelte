<script lang="ts">
	import { formatLink } from '$lib/formatter';
	import type { ContentToken } from '$lib/models/content_token';

	type Props = {
		contentTokens: ContentToken[];
	};

	let { contentTokens }: Props = $props();
</script>

<p class="px-2 pb-2 wrap-anywhere break-all whitespace-pre-wrap">
	{#each contentTokens as token, i (i)}
		{#if token.type === 'text'}
			{token.text}
		{:else if token.type === 'link'}
			<a href={token.url} rel="external" target="_blank" class="underline"
				>{formatLink(token.url)}</a
			>
		{:else if token.type === 'image'}
			<a href={token.url} rel="external" target="_blank"
				><img src={token.url} class="max-h-80 rounded-md border border-gray-600" alt="content" /></a
			>
		{/if}
	{/each}
</p>
