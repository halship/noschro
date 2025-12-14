<script lang="ts">
	import type { NostrEvent, NostrProfile, NostrState } from '$lib/types/nostr';
	import PostMain from './PostMain.svelte';
	import ReactionHeader from './ReactionHeader.svelte';
	import { kindGeneralRepost, kindPost, kindReaction, kindRepost, kindsEvent } from '$lib/consts';
	import { onMount } from 'svelte';
	import { rxReqEvent } from '$lib/timelines/base_timeline';

	let { state, event }: { state: NostrState; event: NostrEvent } = $props();

	let refIds = $derived(event.tags.filter((t) => t[0] === 'e').map((t) => t[1]));

	onMount(() => {
		if (refIds.length > 0 && !(refIds[0] in state.eventsById)) {
			rxReqEvent.emit({
				kinds: kindsEvent,
				ids: [refIds[0]],
				limit: 1
			});
		}
	});
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === kindPost}
		<PostMain {state} {event} />
	{:else if event.kind === kindRepost || event.kind === kindReaction || event.kind === kindGeneralRepost}
		<ReactionHeader {event} profile={state.profiles[event.pubkey]} />

		{#if refIds[0] in state.eventsById}
			<PostMain {state} event={state.eventsById[refIds[0]]} />
		{:else}
			<p>loading...</p>
		{/if}
	{:else}
		<p>kind: {event.kind}</p>
	{/if}
</div>
