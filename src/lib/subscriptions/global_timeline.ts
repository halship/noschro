import { createRxBackwardReq, createRxForwardReq, now } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import type { NostrEvent } from '$lib/nostr_type';
import { addEvent } from '$lib/state.svelte';
import { TIMELINE_LIMIT } from '$lib/constants';

export function subscribeGlobalTimeline() {
	const rxReq = createRxForwardReq();
	const rxReqBack = createRxBackwardReq();

	const subBack = rxNostr.use(rxReqBack).subscribe((packet) => {
		const event = { ...packet.event } as NostrEvent;
		addEvent(event);
	});

	const sub = rxNostr.use(rxReq).subscribe((packet) => {
		const event = { ...packet.event } as NostrEvent;
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
