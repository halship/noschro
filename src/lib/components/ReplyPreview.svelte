<script lang="ts">
	import { omitContent } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import { MessageCircle } from '@lucide/svelte';

	type Props = {
		post?: Post;
	};

	let { post }: Props = $props();
</script>

<div class="px-2 pt-1">
	<MessageCircle class="inline-block size-4" />
	<span>
		{#if post}
			{omitContent(post.content)}
		{:else}
			取得中…
		{/if}
	</span>
</div>
