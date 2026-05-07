import { createRxBackwardReq, createRxForwardReq, now, type EventPacket } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import { createEvent } from '$lib/nostr_type';
import { addEventToTimeline, appState } from '$lib/state.svelte';
import { LOAD_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';
import { requestEvents } from './events';

const rxReq = createRxForwardReq();
const rxReqBack = createRxBackwardReq();

export function subscribeGlobalTimeline() {
	const subBack = rxNostr.use(rxReqBack).subscribe(handlePacket);
	const sub = rxNostr.use(rxReq).subscribe(handlePacket);
	const nowTimestamp = now();

	requestOldGlobalTimeline(nowTimestamp, LOAD_LIMIT);

	rxReq.emit({
		kinds: [1],
		since: nowTimestamp
	});

	return () => {
		sub.unsubscribe();
		subBack.unsubscribe();
		appState.timelineIds = [];
	};
}

export function requestOldGlobalTimeline(until: number, limit: number) {
	rxReqBack.emit({
		kinds: [1],
		until: until,
		limit: limit
	});
}

function handlePacket(packet: EventPacket) {
	const event = createEvent(packet.event);

	const ids = (event.replyToId ? [event.replyToId, ...event.quotedIds] : event.quotedIds).filter(
		(id) => !(id in appState.eventsById)
	);
	const pubkeys = [event.pubkey, ...event.replyToPubkeys].filter(
		(pubkey) => !(pubkey in appState.profilesByPubkey)
	);

	requestEvents(ids);
	requestProfiles(pubkeys);

	addEventToTimeline(event);
}
