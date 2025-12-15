<script lang="ts">
	import type { NostrEvent } from '$lib/types/nostr';
	import PostMain from './PostMain.svelte';
	import ReactionHeader from './ReactionHeader.svelte';
	import {
		kindGeneralRepost,
		kindLongPost,
		kindPost,
		kindReaction,
		kindRepost,
		kindsEvent
	} from '$lib/consts';
	import { onMount } from 'svelte';
	import { rxReqEvent } from '$lib/timelines/base_timeline';
	import { nostrState } from '$lib/state.svelte';

	let { event }: { event: NostrEvent } = $props();

	let refIds = $derived(event.tags.filter((t) => t[0] === 'e').map((t) => t[1]));

	onMount(() => {
		if (refIds.length > 0 && !(refIds.slice(-1)[0] in nostrState.eventsById)) {
			rxReqEvent.emit({
				kinds: kindsEvent,
				ids: [refIds.slice(-1)[0]],
				limit: 1
			});
		}
	});
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === kindPost || event.kind === kindLongPost}
		<PostMain {event} />
	{:else if event.kind === kindRepost || event.kind === kindReaction || event.kind === kindGeneralRepost}
		<ReactionHeader {event} profile={nostrState.profiles[event.pubkey]} />

		{#if refIds.slice(-1)[0] in nostrState.eventsById}
			<PostMain event={nostrState.eventsById[refIds.slice(-1)[0]]} />
		{:else}
			<p>loading...</p>
		{/if}
	{:else}
		<p>kind: {event.kind}</p>
	{/if}
</div>
