import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, type LazyFilter, type RxNostr } from "rx-nostr";
import { verifier } from "@rx-nostr/crypto";
import { defaultRelays, kindFollowList, kindRelayList, loadBufferTime, maxTimelineNum } from "$lib/consts";
import { bufferTime, Subject, type Subscription } from "rxjs";
import { nostrState } from "$lib/state.svelte";
import { getTagValues } from "$lib/util";
import type { Event } from "nostr-typedef";
import { signer, pubkey } from "$lib/signer";
import type { NostrProfile, NostrRelay } from "$lib/types/nostr";

export const rxReqTimeline = createRxForwardReq();
export const rxReqOldTimeline = createRxBackwardReq();
export const rxReqRelays = createRxBackwardReq();
export const rxReqFollow = createRxBackwardReq();
export const rxReqProfiles = createRxForwardReq();

let rxNostr: RxNostr | null = null;

let timelineSub: Subscription | null = null;
let oldTimelineSub: Subscription | null = null;
let profilesSub: Subscription | null = null;

export async function subscribe() {
    if (signer === null || pubkey === null) {
        throw Error('signer or pubkey is null');
    }

    if (rxNostr !== null) return;

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

    const rxReqProfilesBatched = rxReqProfiles
        .pipe(bufferTime(loadBufferTime), batch());
    profilesSub = rxNostr.use(rxReqProfilesBatched)
        .subscribe({
            next: ({ event }) => {
                if ((event.pubkey in nostrState.profiles) &&
                    nostrState.profiles[event.pubkey].created_at > event.created_at) {
                    return;
                }

                const meta = JSON.parse(event.content) as {
                    name?: string;
                    display_name?: string;
                    picture?: string;
                    about?: string;
                };

                const profile: NostrProfile = {
                    pubkey: event.pubkey,
                    tags: event.tags,
                    created_at: event.created_at,
                    name: meta.name,
                    display_name: meta.display_name,
                    picture: meta.picture,
                    about: meta.about,
                };

                nostrState.profiles = { ...nostrState.profiles, [event.pubkey]: profile };
            }
        });

    nostrState.relays = await getRelays(rxNostr);
    nostrState.followees = await getFollowees(rxNostr);
}

export function unsubscribe() {
    timelineSub?.unsubscribe();
    timelineSub = null;
    oldTimelineSub?.unsubscribe();
    oldTimelineSub = null;
    profilesSub?.unsubscribe();
    profilesSub = null;

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

function getRelays(rx: RxNostr): Promise<NostrRelay[]> {
    return new Promise((resolve) => {
        rx.use(rxReqRelays)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const relays = getTagValues(event.tags, 'r')
                        .map((r) => {
                            if (r.length < 2) {
                                return { url: r[0], read: true, write: true };
                            } else if (r[1] === 'read') {
                                return { url: r[0], read: true, write: false };
                            } else {
                                return { url: r[0], read: false, write: true };
                            }
                        });

                    console.log(`[${kindRelayList}] Set default relays`);
                    for (const relay of relays) {
                        console.log(relay);
                    }

                    resolve(relays);
                },
                error: (err) => {
                    console.error(err);
                }
            });

        rxReqRelays.emit({
            kinds: [kindRelayList],
            authors: [pubkey!],
            limit: 1,
        });
    });
}

function getFollowees(rx: RxNostr): Promise<string[]> {
    return new Promise((resolve) => {
        rx.use(rxReqFollow)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const followees = getTagValues(event.tags, 'p')
                        .map((t) => t[0]);

                    console.log(`[${kindFollowList}] Set follow list`);

                    resolve(followees);
                },
                error: (err) => {
                    console.error(err);
                }
            });

        rxReqFollow.emit({
            kinds: [kindFollowList],
            authors: [pubkey!],
            limit: 1,
        });
    });
}
