import { rxNostr } from '$lib/client';
import { toProfile } from '$lib/models/profile';
import { createEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { batch, createRxForwardReq, latestEach } from 'rx-nostr';
import { bufferTime } from 'rxjs';
import { requestEvents } from './events';
import { NOSTR_URI_RE } from '$lib/models/token';
import { decodeNostrURI } from 'nostr-tools/nip19';

const rxReq = createRxForwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());

export function subscribeProfiles() {
	const sub = rxNostr
		.use(batchedReq)
		.pipe(latestEach((packet) => packet.event.pubkey))
		.subscribe((packet) => {
			const event = createEvent(packet.event);

			const profile = toProfile(event);
			if (!profile) return;

			appState.profilesByPubkey = { ...appState.profilesByPubkey, [event.pubkey]: profile };

			if (!profile.about) return;

			const decodedCodes = profile.about
				.matchAll(NOSTR_URI_RE)
				.map((match) => decodeNostrURI(match[1]))
				.toArray();

			const quotedIds = decodedCodes
				.filter((code) => code.type === 'nevent' || code.type === 'note')
				.map((code) => {
					if (code.type === 'nevent') {
						return code.data.id;
					} else {
						return code.data;
					}
				});

			requestEvents(quotedIds);
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
