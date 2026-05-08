import { createEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxBackwardReq, type RxNostr } from 'rx-nostr';
import { bufferTime } from 'rxjs';
import { requestProfiles } from './profiles';

const rxReq = createRxBackwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeEvents(rxNostr: RxNostr) {
	const sub = rxNostr.use(batchedReq).subscribe((packet) => {
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

	return () => {
		sub.unsubscribe();
	};
}

export function requestEvents(ids: string[]) {
	rxReq.emit({
		kinds: [1],
		ids: ids,
		limit: ids.length
	});
}
