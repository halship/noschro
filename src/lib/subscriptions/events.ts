import { rxNostr } from '$lib/client';
import { createEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxBackwardReq } from 'rx-nostr';
import { bufferTime } from 'rxjs';
import { requestProfiles } from './profiles';

const rxReq = createRxBackwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeEvents() {
	const sub = rxNostr.use(batchedReq).subscribe((packet) => {
		const event = createEvent(packet.event);
		appState.eventsById = { ...appState.eventsById, [event.id]: event };

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}

		if (event.replyToId && !(event.replyToId in appState.eventsById)) {
			requestEvents([event.replyToId]);
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
