import { createRxBackwardReq, createRxForwardReq, now, type EventPacket } from 'rx-nostr';
import { createEvent } from '$lib/nostr_type';
import {
	addEventToTimeline,
	getMissingEventIds,
	getMissingProfilePubkeys,
	hasTimelineEvent,
	resetTimelineIds
} from '$lib/state-actions';
import { LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
import { requestProfiles } from './profiles';
import { requestEvents } from './events';
import { Subscription } from 'rxjs';
import type { Client } from '$lib/client';

const rxReq = createRxForwardReq();
const rxReqBack = createRxBackwardReq();
let subBack: Subscription | null = null;
let sub: Subscription | null = null;

export function subscribeTimeline(client: Client) {
	sub?.unsubscribe();
	subBack?.unsubscribe();

	subBack = client.rxNostr.use(rxReqBack).subscribe(handlePacket);
	sub = client.rxNostr.use(rxReq).subscribe(handlePacket);
	const nowTime = now();

	requestNewTimeline(client, nowTime);
	requestOldTimeline(client, nowTime, LOAD_LIMIT);
}

export function unsubscribeTimeline() {
	sub?.unsubscribe();
	subBack?.unsubscribe();
	sub = null;
	subBack = null;
	resetTimelineIds();
}

export function requestNewTimeline(client: Client, since: number) {
	if (client.pubkey) {
		rxReq.emit({
			kinds: [1, 6],
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
			kinds: [1, 6],
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
	resetTimelineIds();
}

function handlePacket(packet: EventPacket) {
	if (hasTimelineEvent(packet.event.id)) return;

	const event = createEvent(packet.event);

	const ids = getMissingEventIds(event.tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]));
	const pubkeys = getMissingProfilePubkeys([event.pubkey, ...event.replyToPubkeys]);

	requestEvents(ids);
	requestProfiles(pubkeys);

	addEventToTimeline(event, TIMELINE_LIMIT);
}
