<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import { Repeat2 } from '@lucide/svelte';
	import { nostrState } from './state.svelte';
	import PostMain from './PostMain.svelte';
	import { formatDisplayName, formatReaction, getRefIds } from './util';
	import ReactionHeader from './ReactionHeader.svelte';

	export let event: NostrEvent;
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === 6 || event.kind === 7 || event.kind === 16}
		<ReactionHeader {event} profile={profiles[event.pubkey]} />

		{#if getRefIds(event)[0] in eventsById}
			<PostMain event={eventsById[getRefIds(event)[0]]} {profiles} />
		{/if}
	{:else}
		<PostMain {event} {profiles} />
	{/if}
</div>
