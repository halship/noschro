import { createEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxBackwardReq } from 'rx-nostr';
import { bufferTime, Subscription } from 'rxjs';
import { requestProfiles } from './profiles';
import type { Client } from '$lib/client';

const rxReq = createRxBackwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());
let sub: Subscription | null = null;

export function subscribeEvents(client: Client) {
	sub = client.rxNostr.use(batchedReq).subscribe((packet) => {
		const event = createEvent(packet.event);
		const ids = (event.replyToId ? [event.replyToId, ...event.quotedIds] : event.quotedIds).filter(
			(id) => !(id in appState.eventsById)
		);
		const pubkeys = [
			...new Set([event.pubkey, ...event.replyToPubkeys, ...event.contentPubkeys])
		].filter((pubkey) => !(pubkey in appState.profilesByPubkey));

		appState.eventsById = { ...appState.eventsById, [event.id]: event };

		requestEvents(ids);
		requestProfiles(pubkeys);
	});
}

export function unsubscribeEvents() {
	sub?.unsubscribe();
}

export function requestEvents(ids: string[]) {
	rxReq.emit({
		kinds: [1],
		ids: ids,
		limit: ids.length
	});
}
