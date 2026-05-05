import { createRxBackwardReq, createRxForwardReq, now, type EventPacket } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import { createEvent } from '$lib/nostr_type';
import { addEventToTimeline, appState } from '$lib/state.svelte';
import { TIMELINE_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';
import { requestEvents } from './events';

export function subscribeGlobalTimeline() {
	const rxReq = createRxForwardReq();
	const rxReqBack = createRxBackwardReq();

	const subBack = rxNostr.use(rxReqBack).subscribe(handlePacket);

	const sub = rxNostr.use(rxReq).subscribe(handlePacket);

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

function handlePacket(packet: EventPacket) {
	const event = createEvent(packet.event);

	if (!(event.pubkey in appState.profilesByPubkey)) {
		requestProfiles([event.pubkey]);
	}

	if (event.replyToId && !(event.replyToId in appState.eventsById)) {
		requestEvents([event.replyToId]);
	}

	addEventToTimeline(event);
}
