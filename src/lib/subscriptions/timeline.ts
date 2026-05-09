import { createRxBackwardReq, createRxForwardReq, now, uniq, type EventPacket } from 'rx-nostr';
import { createEvent, type NostrEvent } from '$lib/nostr_type';
import { appState } from '$lib/state.svelte';
import { LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';
import { requestEvents } from './events';
import { Subject, Subscription } from 'rxjs';
import type { Client } from '$lib/client';

const rxReq = createRxForwardReq();
const rxReqBack = createRxBackwardReq();
const flushes$ = new Subject<void>();
let subBack: Subscription | null = null;
let sub: Subscription | null = null;

export function subscribeTimeline(client: Client) {
	subBack = client.rxNostr.use(rxReqBack).pipe(uniq(flushes$)).subscribe(handlePacket);
	sub = client.rxNostr.use(rxReq).pipe(uniq(flushes$)).subscribe(handlePacket);
	const nowTime = now();

	requestNewTimeline(client, nowTime);
	requestOldTimeline(client, nowTime, LOAD_LIMIT);
}

export function unsubscribeTimeline() {
	sub?.unsubscribe();
	subBack?.unsubscribe();
	appState.timelineIds = [];
	flushes$.next();
}

export function requestNewTimeline(client: Client, since: number) {
	if (client.pubkey) {
		rxReq.emit({
			kinds: [1],
			authors: client.followees,
			since
		});
	} else {
		rxReq.emit({
			kinds: [1],
			since
		});
	}
}

export function requestOldTimeline(client: Client, until: number, limit: number) {
	if (client.pubkey) {
		rxReqBack.emit({
			kinds: [1],
			authors: client.followees,
			until,
			limit
		});
	} else {
		rxReqBack.emit({
			kinds: [1],
			until,
			limit
		});
	}
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
