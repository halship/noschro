<script lang="ts">
	import { onMount } from 'svelte';
	import PostHeader from './PostHeader.svelte';
	import type { NostrEvent, NostrProfile } from './types/nostr';
	import { tagFilter } from './util';
	import { emitProfile } from './subscription';
	import DOMPurify from 'isomorphic-dompurify';
	import MarkdownIt from 'markdown-it';
	import MarkdownItFootnote from 'markdown-it-footnote';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	onMount(() => {
		if (!(event.pubkey in profiles)) {
			emitProfile([event.pubkey]);
		}
	});

	function getTitle(): string {
		return event.tags.filter(tagFilter('title')).map((tag) => tag[1])[0];
	}

	function formatLongContent(content: string) {
		const md = new MarkdownIt().use(MarkdownItFootnote);

		let result = DOMPurify.sanitize(content);
		result = md.render(content);

		return result;
	}
</script>

<div id={event.id} class="longform border-thin border rounded-md p-2 mt-2">
	<PostHeader {event} profile={profiles[event.pubkey]} />

	{#if event.tags.filter(tagFilter('title')).length > 0}
		<h1 class="text-3xl font-bold mb-3">{getTitle()}</h1>
	{/if}

	<div class="longform-content">{@html formatLongContent(event.content)}</div>
</div>
