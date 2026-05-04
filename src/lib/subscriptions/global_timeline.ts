import { createRxBackwardReq, createRxForwardReq, now } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import { createEvent } from '$lib/nostr_type';
import { addEventToTimeline, appState } from '$lib/state.svelte';
import { TIMELINE_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';

export function subscribeGlobalTimeline() {
	const rxReq = createRxForwardReq();
	const rxReqBack = createRxBackwardReq();

	const subBack = rxNostr.use(rxReqBack).subscribe((packet) => {
		const event = createEvent(packet.event);
		addEventToTimeline(event);

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}

		addEventToTimeline(event);
	});

	const sub = rxNostr.use(rxReq).subscribe((packet) => {
		const event = createEvent(packet.event);
		addEventToTimeline(event);

		if (!(event.pubkey in appState.profilesByPubkey)) {
			requestProfiles([event.pubkey]);
		}

		addEventToTimeline(event);
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
