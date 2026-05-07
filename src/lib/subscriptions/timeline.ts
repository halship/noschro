import { createRxBackwardReq, createRxForwardReq, now, uniq, type EventPacket } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import { createEvent } from '$lib/nostr_type';
import { addEventToTimeline, appState } from '$lib/state.svelte';
import { LOAD_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';
import { requestEvents } from './events';
import { Subject } from 'rxjs';

const rxReq = createRxForwardReq();
const rxReqBack = createRxBackwardReq();
const flushes$ = new Subject<void>();

export function subscribeGlobalTimeline() {
	const subBack = rxNostr.use(rxReqBack).pipe(uniq(flushes$)).subscribe(handlePacket);
	const sub = rxNostr.use(rxReq).pipe(uniq(flushes$)).subscribe(handlePacket);
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
		flushes$.next();
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
	const pubkeys = [event.pubkey, ...event.replyToPubkeys].filter(
		(pubkey) => !(pubkey in appState.profilesByPubkey)
	);
	const ids = event.quotedIds.filter((id) => !(id in appState.eventsById));

	requestProfiles(pubkeys);
	requestEvents(ids);

	if (event.replyToId && !(event.replyToId in appState.eventsById)) {
		requestEvents([event.replyToId]);
	}

	addEventToTimeline(event);
}
