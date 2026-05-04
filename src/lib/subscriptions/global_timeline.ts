import { createRxBackwardReq, createRxForwardReq, now } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import type { NostrEvent } from '$lib/nostr_type';
import { addEvent, appState } from '$lib/state.svelte';
import { TIMELINE_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';

export function subscribeGlobalTimeline() {
	const rxReq = createRxForwardReq();
	const rxReqBack = createRxBackwardReq();

	const subBack = rxNostr.use(rxReqBack).subscribe((packet) => {
		const event = { ...packet.event } as NostrEvent;

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}

		addEvent(event);
	});

	const sub = rxNostr.use(rxReq).subscribe((packet) => {
		const event = { ...packet.event } as NostrEvent;

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}

		addEvent(event);
	});

	rxReqBack.emit([
		{
			kinds: [1],
			until: now(),
			limit: TIMELINE_LIMIT
		}
	]);

	rxReq.emit([
		{
			kinds: [1],
			since: now()
		}
	]);

	return () => {
		sub.unsubscribe();
		subBack.unsubscribe();
	};
}
