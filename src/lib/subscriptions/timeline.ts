import { client } from '$lib/client';
import { nostrState } from '$lib/state.svelte';
import { createRxBackwardReq, createRxForwardReq, latest, now, uniq } from 'rx-nostr';
import { Subject, type Subscription } from 'rxjs';

const rxReqTimelineFor = createRxForwardReq();
const rxReqRelays = createRxBackwardReq();
const rxReqFollowees = createRxBackwardReq();

let subTimeline: Subscription | null = null;
let subRelays: Subscription | null = null;
let subFollowees: Subscription | null = null;

const flushes$ = new Subject<void>();

export function subscribeTimeline() {
	if (!client) return;

	subTimeline = client.rxNostr
		.use(rxReqTimelineFor)
		.pipe(uniq(flushes$))
		.subscribe({
			next: (packet) => {
				const event = packet.event;
				nostrState.eventsById = { ...nostrState.eventsById, [event.id]: event };
				nostrState.timelineIds = [event.id, ...nostrState.timelineIds].slice(0, 30);
			}
		});

	subRelays = client.rxNostr
		.use(rxReqRelays)
		.pipe(latest())
		.subscribe({
			next: (packet) => {
				const event = packet.event;
				nostrState.relays = event.tags
					.filter((tag) => tag[0] === 'r')
					.map((tag) => {
						if (tag[2] === 'read') {
							return { url: tag[1], read: true, write: false };
						} else if (tag[2] === 'write') {
							return { url: tag[1], read: false, write: true };
						} else {
							return { url: tag[1], read: true, write: true };
						}
					});
			},
			complete: () => {
				if (!client) return;

				client.rxNostr.setDefaultRelays(nostrState.relays);
				rxReqFollowees.emit({
					kinds: [3],
					authors: [client.pubkey],
					limit: 1
				});
			}
		});

	subFollowees = client.rxNostr
		.use(rxReqFollowees)
		.pipe(latest())
		.subscribe({
			next: (packet) => {
				const event = packet.event;
				nostrState.followees = event.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]);
			},
			complete: () => {
				rxReqTimelineFor.emit({
					kinds: [1],
					authors: nostrState.followees,
					since: now()
				});
			}
		});

	if (nostrState.relays.length > 0) {
		rxReqTimelineFor.emit({
			kinds: [1],
			authors: nostrState.followees,
			since: now()
		});
	} else {
		rxReqRelays.emit({
			kinds: [10002],
			authors: [client.pubkey],
			limit: 1
		});
	}
}

export function unsubscribeTimeline() {
	subTimeline?.unsubscribe();
	subRelays?.unsubscribe();
	subFollowees?.unsubscribe();

	flushes$.next();
	nostrState.timelineIds = [];
}
