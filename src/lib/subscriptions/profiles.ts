import { toProfile } from '$lib/models/profile';
import { createEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxForwardReq, latestEach, type RxNostr } from 'rx-nostr';
import { bufferTime } from 'rxjs';
import { requestEvents } from './events';

const rxReq = createRxForwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeProfiles(rxNostr: RxNostr) {
	const sub = rxNostr
		.use(batchedReq)
		.pipe(latestEach((packet) => packet.event.pubkey))
		.subscribe((packet) => {
			const event = createEvent(packet.event);

			const profile = toProfile(event);
			if (!profile) return;

			appState.profilesByPubkey = { ...appState.profilesByPubkey, [event.pubkey]: profile };

			const ids = profile.quoteIds.filter((id) => !(id in appState.eventsById));
			const pubkeys = profile.contentPubkeys.filter((pubkey) => !(pubkey in appState.eventsById));

			requestEvents(ids);
			requestProfiles(pubkeys);
		});

	return () => {
		sub.unsubscribe();
	};
}

export function requestProfiles(pubkeys: string[]) {
	if (pubkeys.length === 0) return;

	rxReq.emit({
		kinds: [0],
		authors: pubkeys,
		limit: pubkeys.length
	});
}
