<script lang="ts">
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
		{/if}
	{/each}
</div>
