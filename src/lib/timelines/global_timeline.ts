import { createRxForwardReq, now } from 'rx-nostr';
import { rxNostr } from '$lib/client';
import type { NostrEvent } from '$lib/nostr_type';
import { addEvent } from '$lib/state.svelte';
import { EVENTS_LIMIT } from '$lib/constants';

export function subscribeGlobalTimeline() {
	const rxReq = createRxForwardReq();

	const sub = rxNostr.use(rxReq).subscribe((packet) => {
		const event = { ...packet.event } as NostrEvent;
		if (event.kind !== 1) return;
		addEvent(event);
	});

	rxReq.emit([
		{
			kinds: [1],
			since: now(),
			limit: EVENTS_LIMIT
		}
	]);

	return () => {
		sub.unsubscribe();
	};
}
