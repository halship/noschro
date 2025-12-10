import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, nip07Signer, now, sortEvents, uniq, type LazyFilter, type RxNostr } from "rx-nostr";
import { seckeySigner, verifier } from "@rx-nostr/crypto";
import { bufferTime, Subject, Subscription } from "rxjs";
import { browser } from "$app/environment";
import type { NostrEvent, NostrProfile } from "$lib/types/nostr";
import { nostrState } from "./state.svelte";
import type { Event } from "nostr-tools";
import type { EventSigner } from "@rx-nostr/crypto/src";
import { getRefIds, getRefPubkeys } from "./util";
import { maxTimeline } from "./consts";

let signer: EventSigner | null = null;
let rxNostr: RxNostr | null = null;

let rxReqTimeline: any | null = null;
let rxReqProfile: any | null = null;
let rxReqRelay: any | null = null;
let rxReqEvent: any | null = null;
let rxReqFollow: any | null = null;
let rxReqOlderTimeline: any | null = null;

const flushesTimeline$ = new Subject<void>();
const flushesProfile$ = new Subject<void>();
const flushesEvent$ = new Subject<void>();
const flushesOlderTimeline$ = new Subject<void>();

let timelineSub: Subscription | undefined = undefined;
let profileSub: Subscription | undefined = undefined;
let relaySub: Subscription | undefined = undefined;
let eventSub: Subscription | undefined = undefined;
let followSub: Subscription | undefined = undefined;
let olderTimelineSub: Subscription | undefined = undefined;

let pendingEvents: string[] = [];
let pendingProfiles: string[] = [];

export async function connectNostr(): Promise<boolean> {
    if (rxNostr) return true;

    if (browser) {
        const savedLogin = localStorage.getItem('login');

        if (savedLogin === null) return false;

        if (savedLogin!.startsWith('nsec')) {
            signer = seckeySigner(savedLogin);
        } else if (savedLogin! === 'NIP07') {
            signer = nip07Signer();
        }

        if (signer) {
            const pubkey = await signer.getPublicKey();

            rxNostr = createRxNostr({
                verifier,
                signer,
            });

            rxNostr?.setDefaultRelays(['wss://yabu.me']);

            rxReqTimeline = createRxForwardReq();
            rxReqProfile = createRxBackwardReq();
            rxReqRelay = createRxBackwardReq();
            rxReqEvent = createRxBackwardReq();
            rxReqFollow = createRxBackwardReq();
            rxReqOlderTimeline = createRxBackwardReq();

            // タイムライン購読
            timelineSub = rxNostr!.use(rxReqTimeline)
                .pipe(uniq(flushesTimeline$))
                .subscribe({
                    next: ({ event }) => processHomeTimeline(event, pubkey),
                    error: (err) => {
                        console.log(err);
                    },
                });
            flushesTimeline$.next();

            // プロフィール購読
            const rxReqProfileBatched = rxReqProfile.pipe(bufferTime(1000), batch());
            profileSub = rxNostr!
                .use(rxReqProfileBatched)
                .pipe(uniq(flushesProfile$), sortEvents(3000))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 0) return;

                        try {
                            const meta = JSON.parse(event.content) as {
                                name?: string;
                                display_name?: string;
                                picture?: string;
                                about?: string;
                            };

                            const profile: NostrProfile = {
                                pubkey: event.pubkey,
                                name: meta.name,
                                display_name: meta.display_name,
                                picture: meta.picture,
                                about: meta.about,
                                tags: event.tags,
                            };

                            nostrState.profiles = { ...nostrState.profiles, [event.pubkey]: profile };
                        } catch (e) {
                            console.warn('Failed to parse profile metadata', e);
                        }
                    },
                    error: (err) => {
                        console.error(err);
                    }
                });
            flushesProfile$.next();

            // リレー情報購読
            relaySub = rxNostr!
                .use(rxReqRelay)
                .pipe(latest())
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 10002) return;

                        const relays = event.tags.filter((tag) => tag[0] === 'r')
                            .map((tag) => tag[1]);

                        rxNostr?.setDefaultRelays(relays);
                    }
                });

            // 個別投稿取得
            const rxReqEventBatched = rxReqEvent.pipe(bufferTime(1000), batch());
            eventSub = rxNostr!
                .use(rxReqEventBatched)
                .pipe(uniq(flushesEvent$))
                .subscribe({
                    next: ({ event }) => {
                        analyzeEvent(event);

                        const nostrEvent: NostrEvent = { ...event };
                        nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };
                    },
                    error: (err) => {
                        console.error(err);
                    }
                });
            flushesEvent$.next();

            // フォローリスト購読
            followSub = rxNostr!.use(rxReqFollow)
                .pipe(latest())
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 3) return;

                        let pubkeys = event.tags
                            .filter((tag) => tag[0] === 'p')
                            .map((tag) => tag[1]);

                        subscribeTimeline(pubkeys, pubkey);
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });

            // 古いイベントの購読
            olderTimelineSub = rxNostr!
                .use(rxReqOlderTimeline)
                .pipe(uniq(flushesOlderTimeline$), sortEvents(3000))
                .subscribe({
                    next: ({ event }) => processHomeTimeline(event, pubkey),
                    complete: () => {
                        nostrState.events = nostrState.events.toSorted((a, b) => b.created_at - a.created_at);
                        nostrState.notifications = nostrState.notifications.toSorted((a, b) => b.created_at - a.created_at);
                        console.log('Complete load old event');
                        nostrState.tlLoading = false;
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesOlderTimeline$.next();

            rxReqRelay.emit({
                kinds: [10002],
                authors: [pubkey],
                until: now,
                limit: 1
            });
            rxReqRelay.over();

            rxReqFollow.emit({
                kinds: [3],
                authors: [pubkey],
                until: now,
                limit: 1,
            });
            rxReqFollow.over();

            emitEvent(pendingEvents);
            pendingEvents = [];
            emitProfile(pendingProfiles);
            pendingProfiles = [];

            return true;
        }
    }

    return false;
}

export function disconnectNostr() {
    timelineSub?.unsubscribe();
    profileSub?.unsubscribe();
    relaySub?.unsubscribe();
    eventSub?.unsubscribe();
    followSub?.unsubscribe();
    olderTimelineSub?.unsubscribe();
    rxNostr?.dispose();

    timelineSub = undefined;
    profileSub = undefined;
    rxReqTimeline = null;
    rxReqProfile = null;
    rxReqRelay = null;
    rxReqEvent = null;
    rxReqFollow = null;
    rxReqOlderTimeline = null;
    rxNostr = null;
    signer = null;

    nostrState.events = [];
    nostrState.eventsById = {};
    nostrState.profiles = {};
    nostrState.authoricated = false;
    nostrState.notifications = [];
}

export function emitEvent(ids: string[]) {
    if (ids.length === 0) return;

    if (rxNostr) {
        rxReqEvent?.emit({
            kinds: [1, 5, 6, 7, 16],
            ids,
            limit: ids.length,
        });
    } else {
        pendingEvents = [...pendingEvents, ...ids];
    }
}

export function emitProfile(authors: string[]) {
    if (authors.length === 0) return;

    if (rxNostr) {
        rxReqProfile?.emit({
            kinds: [0],
            authors,
            limit: authors.length,
        });
    } else {
        pendingProfiles = [...pendingProfiles, ...authors];
    }
}

export function getSigner(): EventSigner | null {
    return signer;
}

function processEvent(event: Event, mypubkey: string) {
    const nostrEvent: NostrEvent = { ...event };
    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, maxTimeline);
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

    const isReferenceMe = getRefPubkeys(event).filter((key) => key === mypubkey).length > 0;
    if (isReferenceMe) {
        nostrState.notifications = [nostrEvent, ...nostrState.notifications].slice(0, maxTimeline);
    }
}

function processDelete(event: Event) {
    const ids = getRefIds(event);
    if (ids.length == 0) return;

    nostrState.events = nostrState.events.filter((ev) => ev.id !== ids[0]);
}

function processReaction(event: Event) {
    const nostrEvent: NostrEvent = { ...event };

    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, maxTimeline);
    nostrState.notifications = [nostrEvent, ...nostrState.notifications].slice(0, maxTimeline);
}

function processHomeTimeline(event: Event, mypubkey: string) {
    analyzeEvent(event);
    if (event.kind === 1 || event.kind === 6 || event.kind === 16) processEvent(event, mypubkey);
    else if (event.kind === 5) processDelete(event);
    else if (event.kind === 7) processReaction(event);
}

function subscribeTimeline(followees: string[], mypubkey: string) {
    rxReqOlderTimeline.emit({
        kinds: [1, 5, 6, 16],
        authors: followees,
        until: nostrState.events.at(-1)?.created_at ?? now(),
        limit: 25,
    });
    rxReqOlderTimeline.over();

    rxReqTimeline.emit([
        {
            kinds: [1, 5, 6, 16],
            authors: followees,
            since: now,
        },
        {
            kinds: [7],
            '#p': [mypubkey],
            since: now,
        },
    ]);
}

function analyzeEvent(event: Event) {
    if (!(event.pubkey in nostrState.profiles)) {
        emitProfile([event.pubkey]);
    }

    const refIds = getRefIds(event).filter((id) => !(id in nostrState.eventsById));
    const refPubkeys = getRefPubkeys(event).filter((key) => !(key in nostrState.profiles));

    if (refIds.length > 0) emitEvent(refIds);
    if (refPubkeys.length > 0) emitProfile(refPubkeys);
}
