import { createEvent } from '$lib/nostr_type';
import { getMissingEventIds, getMissingProfilePubkeys, upsertEvent } from '$lib/state-actions';
import { batch, createRxBackwardReq } from 'rx-nostr';
import { bufferTime, Subscription } from 'rxjs';
import { requestProfiles } from './profiles';
import type { Client } from '$lib/client';

const rxReq = createRxBackwardReq();
const batchedReq = rxReq.pipe(bufferTime(1000), batch());
let sub: Subscription | null = null;

export function subscribeEvents(client: Client) {
	unsubscribeEvents();

	sub = client.rxNostr.use(batchedReq).subscribe((packet) => {
		const event = createEvent(packet.event);
		const ids = getMissingEventIds(
			event.replyToId ? [event.replyToId, ...event.quotedIds] : event.quotedIds
		);
		const pubkeys = getMissingProfilePubkeys([
			...new Set([event.pubkey, ...event.replyToPubkeys, ...event.contentPubkeys])
		]);

		upsertEvent(event);

		requestEvents(ids);
		requestProfiles(pubkeys);
	});
}

export function unsubscribeEvents() {
	sub?.unsubscribe();
	sub = null;
}

export function requestEvents(ids: string[]) {
	if (ids.length === 0) return;

	rxReq.emit({
		kinds: [1],
		ids: ids,
		limit: ids.length
	});
}
