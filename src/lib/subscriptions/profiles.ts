import { rxNostr } from '$lib/client';
import { toProfile } from '$lib/models/profile';
import type { NostrEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxForwardReq, latestEach } from 'rx-nostr';
import { bufferTime } from 'rxjs';

const rxReq = createRxForwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeProfiles() {
	const sub = rxNostr
		.use(batchedReq)
		.pipe(latestEach((packet) => packet.event.pubkey))
		.subscribe((packet) => {
			const event = packet.event as NostrEvent;

			const profile = toProfile(event);
			if (profile !== null) {
				appState.profilesByPubkey = { ...appState.profilesByPubkey, [event.pubkey]: profile };
			}
		});

	return () => {
		sub.unsubscribe();
	};
}

export function requestProfiles(pubkeys: string[]) {
	rxReq.emit({
		kinds: [0],
		authors: pubkeys,
		limit: pubkeys.length
	});
}
