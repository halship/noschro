<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import PostMain from './PostMain.svelte';
	import ReactionHeader from './ReactionHeader.svelte';
	import { onMount } from 'svelte';
	import { rxReqEvent, rxReqProfiles, subscribe } from '$lib/timelines/base_timeline';
	import { kindGeneralRepost, kindMetaData, kindPost, kindReaction, kindRepost } from '$lib/consts';

	export let event: NostrEvent;
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;

	let refIds = event.tags.filter((t) => t[0] === 'e').map((t) => t[1]);
	let refPubkeys = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);

	onMount(async () => {
		await subscribe();

		if (!(event.pubkey in profiles)) {
			rxReqProfiles.emit({
				kinds: [kindMetaData],
				authors: [event.pubkey],
				limit: 1
			});
		}

		const ids = refIds.filter((id) => !(id in eventsById));
		if (ids.length > 0) {
			rxReqEvent.emit({
				kinds: [kindPost],
				ids: ids,
				limit: ids.length
			});
		}

		const pubkeys = refPubkeys.filter((pub) => !(pub in profiles));
		if (pubkeys.length > 0) {
			rxReqProfiles.emit({
				kinds: [kindMetaData],
				authors: pubkeys,
				limit: 1
			});
		}
	});
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === kindPost}
		<PostMain {event} {profiles} />
	{:else if event.kind === kindRepost || event.kind === kindReaction || event.kind === kindGeneralRepost}
		<ReactionHeader {event} profile={profiles[event.pubkey]} />

		{#if refIds[0] in eventsById}
			<PostMain event={eventsById[refIds[0]]} {profiles} />
		{:else}
			<p>loading...</p>
		{/if}
	{:else}
		<p>kind: {event.kind}</p>
	{/if}
</div>
