import { rxNostr } from '$lib/client';
import type { NostrEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxBackwardReq } from 'rx-nostr';
import { bufferTime } from 'rxjs';
import { requestProfiles } from './profiles';

const rxReq = createRxBackwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeEvents() {
	const sub = rxNostr.use(batchedReq).subscribe((packet) => {
		const event = packet.event as NostrEvent;
		appState.eventsById = { ...appState.eventsById, [event.id]: event };

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}
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
