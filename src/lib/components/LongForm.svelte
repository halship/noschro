<script lang="ts">
	import PostHeader from './PostHeader.svelte';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import DOMPurify from 'isomorphic-dompurify';
	import MarkdownIt from 'markdown-it';
	import MarkdownItFootnote from 'markdown-it-footnote';
	import PostUserImage from './PostUserImage.svelte';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	let title: string | undefined = event.tags
		.filter((t) => t[0] === 'title')
		.map((tag) => tag[1])
		.at(0);

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
	<PostUserImage pubkey={event.pubkey} {profiles} />

	<PostHeader {event} profile={profiles[event.pubkey]} />

	{#if title}
		<h1 class="text-3xl font-bold mb-3">{title}</h1>
	{/if}

	<div class="longform-content">{@html formatLongContent(event.content)}</div>
</div>
