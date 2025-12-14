<script lang="ts">
	import PostHeader from './PostHeader.svelte';
	import type { NostrEvent, NostrState } from '$lib/types/nostr';
	import DOMPurify from 'isomorphic-dompurify';
	import MarkdownIt from 'markdown-it';
	import MarkdownItFootnote from 'markdown-it-footnote';
	import PostUserImage from './PostUserImage.svelte';

	let { state, event }: { state: NostrState; event: NostrEvent } = $props();

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
	<PostUserImage profile={state.profiles[event.pubkey]} />
	<PostHeader {event} profile={state.profiles[event.pubkey]} />

	{#if title}
		<h1 class="text-3xl font-bold mb-3">{title}</h1>
	{/if}

	<div class="longform-content">{@html formatLongContent(event.content)}</div>
</div>
