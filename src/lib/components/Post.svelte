<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import PostMain from './PostMain.svelte';
	import ReactionHeader from './ReactionHeader.svelte';
	import { kindGeneralRepost, kindPost, kindReaction, kindRepost } from '$lib/consts';

	export let event: NostrEvent;
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;

	let refIds = event.tags.filter((t) => t[0] === 'e').map((t) => t[1]);
	let refPubkeys = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === kindPost}
		<PostMain {event} {profiles} {eventsById} />
	{:else if event.kind === kindRepost || event.kind === kindReaction || event.kind === kindGeneralRepost}
		<ReactionHeader {event} profile={profiles[event.pubkey]} />

		{#if refIds[0] in eventsById}
			<PostMain event={eventsById[refIds[0]]} {profiles} {eventsById} />
		{:else}
			<p>loading...</p>
		{/if}
	{:else}
		<p>kind: {event.kind}</p>
	{/if}
</div>
