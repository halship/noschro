<script lang="ts">
	import PostHeader from './PostHeader.svelte';
	import type { NostrEvent } from '$lib/types/nostr';
	import DOMPurify from 'isomorphic-dompurify';
	import MarkdownIt from 'markdown-it';
	import MarkdownItFootnote from 'markdown-it-footnote';
	import PostUserImage from './PostUserImage.svelte';
	import { nostrState } from '$lib/state.svelte';

	let { event }: { event: NostrEvent } = $props();

	let title: string | undefined = $derived(
		event.tags
			.filter((t) => t[0] === 'title')
			.map((tag) => tag[1])
			.at(0)
	);

	function formatLongContent(content: string) {
		const md = new MarkdownIt().use(MarkdownItFootnote);

		let result = DOMPurify.sanitize(content);
		result = md.render(content);

		return result;
	}
</script>

<div
	id={event.id}
	class="longform border-thin border rounded-md p-2 mt-2 grid grid-cols-[auto_1fr] grid-rows-[auto_1fr]"
>
	<PostUserImage profile={nostrState.profiles[event.pubkey]} />
	<PostHeader
		{event}
		profile={nostrState.profiles[event.pubkey]}
		user_general_status={nostrState.userGeneralStatuses[event.pubkey]}
		user_music_status={nostrState.userMusicStatuses[event.pubkey]}
	/>

	{#if title}
		<h1 class="text-3xl font-bold mb-3">{title}</h1>
	{/if}

	<div class="longform-content wrap-anywhere break-all">
		{@html formatLongContent(event.content)}
	</div>
</div>
