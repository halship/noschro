import { createRxBackwardReq, createRxForwardReq, now, uniq, type EventPacket } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import { createEvent, type NostrEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
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
	};
}

export function requestOldGlobalTimeline(until: number, limit: number) {
	rxReqBack.emit({
		kinds: [1],
		until: until,
		limit: limit
	});
}

export function resetTimeline() {
	appState.timelineIds = [];
	flushes$.next();
}

function handlePacket(packet: EventPacket) {
	if (appState.timelineIds.includes(packet.event.id)) return;

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

function addEventToTimeline(event: NostrEvent) {
	appState.eventsById = { ...appState.eventsById, [event.id]: event };

	const createdAt = appState.eventsById[event.id].created_at;

	const index = appState.timelineIds.findIndex((id) => {
		return appState.eventsById[id].created_at < createdAt;
	});

	if (index === -1) {
		appState.timelineIds = [...appState.timelineIds, event.id];
	} else {
		appState.timelineIds = [
			...appState.timelineIds.slice(0, index),
			event.id,
			...appState.timelineIds.slice(index)
		];
	}

	if (appState.timelineIds.length > TIMELINE_LIMIT) {
		appState.timelineIds = appState.timelineIds.slice(0, TIMELINE_LIMIT);
	}
}
