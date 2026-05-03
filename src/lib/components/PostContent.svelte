<script lang="ts">
	import { formatLink } from '$lib/formatter';
	import type { ContentToken } from '$lib/models/content_token';

	type Props = {
		contentTokens: ContentToken[];
	};

	let { contentTokens }: Props = $props();
</script>

<div class="px-2 pb-2 wrap-anywhere break-all whitespace-pre-wrap">
	{#each contentTokens as token (token)}
		{#if token.type === 'text'}
			{token.text}
		{:else if token.type === 'link'}
			<a href={token.url} rel="external" class="underline">{formatLink(token.url)}</a>
		{:else if token.type === 'image'}
			<a href={token.url} rel="external"
				><img src={token.url} class="h-80 rounded-md border border-gray-600" alt="content" /></a
			>
		{/if}
	{/each}
</div>
