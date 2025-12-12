import { createRxBackwardReq, createRxForwardReq, createRxNostr, latest, type LazyFilter, type RxNostr } from "rx-nostr";
import { verifier, type EventSigner } from "@rx-nostr/crypto";
import { defaultRelays, kindFollowList, kindRelayList, maxTimelineNum } from "$lib/consts";
import type { Subscription } from "rxjs";
import { nostrState } from "$lib/state.svelte";
import { getTagValues } from "$lib/util";
import type { Event } from "nostr-typedef";

export const rxReqTimeline = createRxForwardReq();
export const rxReqOldTimeline = createRxBackwardReq();
export const rxReqRelays = createRxBackwardReq();
export const rxReqFollow = createRxBackwardReq();

let rxNostr: RxNostr | null = null;

let timelineSub: Subscription | null = null;
let oldTimelineSub: Subscription | null = null;
let relaysSub: Subscription | null = null;
let followSub: Subscription | null = null;

export function subscribe(signer: EventSigner, pubkey: string) {
    if (signer === null || pubkey === null) {
        throw Error('signer or pubkey is null');
    }

    rxNostr = createRxNostr({
        verifier,
        signer,
    });
    rxNostr.setDefaultRelays(defaultRelays);

    timelineSub = rxNostr.use(rxReqTimeline)
        .subscribe({
            next: ({ event }) => setTimeline(event),
            error: (err) => {
                console.error(err);
            }
        });

    oldTimelineSub = rxNostr.use(rxReqOldTimeline)
        .subscribe({
            next: ({ event }) => setTimeline(event),
            error: (err) => {
                console.error(err);
            }
        });

    relaysSub = rxNostr.use(rxReqRelays)
        .pipe(latest())
        .subscribe({
            next: ({ event }) => {
                nostrState.relays = getTagValues(event.tags, 'r')
                    .map((r) => {
                        if (r.length < 2) {
                            return { url: r[0], read: true, write: true };
                        } else if (r[1] === 'read') {
                            return { url: r[0], read: true, write: false };
                        } else {
                            return { url: r[0], read: false, write: true };
                        }
                    });
                rxNostr?.setDefaultRelays(nostrState.relays);

                console.log(`[${kindRelayList}] Set default relays`);
                for (const relay of nostrState.relays) {
                    console.log(relay);
                }
            },
            error: (err) => {
                console.error(err);
            }
        });

    followSub = rxNostr.use(rxReqFollow)
        .pipe(latest())
        .subscribe({
            next: ({ event }) => {
                nostrState.followees = getTagValues(event.tags, 'p')
                    .map((t) => t[0]);

                console.log(`[${kindFollowList}] Set follow list`);
            },
            error: (err) => {
                console.error(err);
            }
        });
}

export function unsubscribe() {
    timelineSub?.unsubscribe();
    timelineSub = null;
    oldTimelineSub?.unsubscribe();
    oldTimelineSub = null;
    relaysSub?.unsubscribe();
    relaysSub = null;
    followSub?.unsubscribe();
    followSub = null;

    rxNostr?.dispose();
    rxNostr = null;
}

function setTimeline(event: Event) {
    if (event.id in nostrState.eventsById) {
        return;
    }

    const nostrEvent = { ...event };

    const index = nostrState.events
        .findIndex((ev) => ev.created_at < nostrEvent.created_at);
    if (index < 0) {
        nostrState.events = [...nostrState.events, nostrEvent].slice(0, maxTimelineNum);
    } else {
        nostrState.events = nostrState.events
            .toSpliced(index, 0, nostrEvent).slice(0, maxTimelineNum);
    }

    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

    const identifiers = getTagValues(event.tags, 'd');
    if (identifiers.length > 0) {
        const key = `${event.kind}:${event.pubkey}:${identifiers[0][0]}`;
        nostrState.eventsByAddr = { ...nostrState.eventsByAddr, [key]: nostrEvent };
    }
}
