<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import PostMain from './PostMain.svelte';
	import { getRefIds, getRefPubkeys } from '../util';
	import ReactionHeader from './ReactionHeader.svelte';
	import { onMount } from 'svelte';
	import { rxReqProfiles, subscribe } from '$lib/timelines/base_timeline';
	import { kindMetaData } from '$lib/consts';

	export let event: NostrEvent;
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;

	onMount(async () => {
		await subscribe();

		if (!(event.pubkey in profiles)) {
			rxReqProfiles.emit({
				kinds: [kindMetaData],
				authors: [event.pubkey],
				limit: 1
			});
		}

		const ids = getRefIds(event);
		if (ids.length > 0) {
			//emitEvent(ids.filter((id) => !(id in eventsById)));
		}

		const pubkeys = getRefPubkeys(event);
		if (pubkeys.length > 0) {
			//emitProfile(pubkeys.filter((key) => !(key in profiles)));
		}
	});
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === 1}
		<PostMain {event} {profiles} />
	{:else if event.kind === 6 || event.kind === 7 || event.kind === 16}
		<ReactionHeader {event} profile={profiles[event.pubkey]} />

		{#if getRefIds(event)[0] in eventsById}
			<PostMain event={eventsById[getRefIds(event)[0]]} {profiles} />
		{:else}
			<p>loading...</p>
		{/if}
	{/if}
</div>
