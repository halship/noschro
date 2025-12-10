import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, nip07Signer, now, uniq, type RxNostr } from "rx-nostr";
import { seckeySigner, verifier } from "@rx-nostr/crypto";
import { bufferTime, Subject, Subscription } from "rxjs";
import { browser } from "$app/environment";
import type { NostrEvent, NostrProfile } from "$lib/types/nostr";
import { nostrState } from "./state.svelte";
import type { Event } from "nostr-tools";
import type { EventSigner } from "@rx-nostr/crypto/src";
import { getRefIds, getRefPubkeys } from "./util";
import { loadBufferTime, loadLimit, maxTimeline } from "./consts";

let signer: EventSigner | null = null;
let rxNostr: RxNostr | null = null;
let pubkey: string | null = null;
let followees: string[] = [];

let rxReqTimeline: any | null = null;
let rxReqProfile: any | null = null;
let rxReqRelay: any | null = null;
let rxReqEvent: any | null = null;
let rxReqFollow: any | null = null;
let rxReqOlderTimeline: any | null = null;
let rxReqOlderReaction: any | null = null;

const flushesTimeline$ = new Subject<void>();
const flushesProfile$ = new Subject<void>();
const flushesEvent$ = new Subject<void>();
const flushesOlderTimeline$ = new Subject<void>();
const flushesOlderReaction$ = new Subject<void>();

let timelineSub: Subscription | undefined = undefined;
let profileSub: Subscription | undefined = undefined;
let relaySub: Subscription | undefined = undefined;
let eventSub: Subscription | undefined = undefined;
let followSub: Subscription | undefined = undefined;
let olderTimelineSub: Subscription | undefined = undefined;
let olderReactionSub: Subscription | undefined = undefined;

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
            pubkey = await signer.getPublicKey();

            rxNostr = createRxNostr({
                verifier,
                signer,
            });

            rxNostr?.setDefaultRelays([
                'wss://yabu.me',
                'wss://relay-jp.nostr.wirednet.jp',
                'wss://relay.damus.io',
                'wss://nrelay-jp.c-stellar.net'
            ]);

            rxReqTimeline = createRxForwardReq();
            rxReqProfile = createRxBackwardReq();
            rxReqRelay = createRxBackwardReq();
            rxReqEvent = createRxBackwardReq();
            rxReqFollow = createRxBackwardReq();
            rxReqOlderTimeline = createRxBackwardReq();
            rxReqOlderReaction = createRxBackwardReq();

            // タイムライン購読
            timelineSub = rxNostr!.use(rxReqTimeline)
                .pipe(uniq(flushesTimeline$))
                .subscribe({
                    next: ({ event }) => processHomeTimeline(event),
                    error: (err) => {
                        console.log(err);
                    },
                });
            flushesTimeline$.next();

            // プロフィール購読
            const rxReqProfileBatched = rxReqProfile.pipe(bufferTime(loadBufferTime), batch());
            profileSub = rxNostr!
                .use(rxReqProfileBatched)
                .pipe(uniq(flushesProfile$))
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
                                created_at: event.created_at,
                            };

                            if (!(event.pubkey in nostrState) ||
                                (nostrState.profiles[event.pubkey].created_at < profile.created_at)) {
                                nostrState.profiles = { ...nostrState.profiles, [event.pubkey]: profile };
                            }
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
            const rxReqEventBatched = rxReqEvent.pipe(bufferTime(loadBufferTime), batch());
            eventSub = rxNostr!
                .use(rxReqEventBatched)
                .pipe(uniq(flushesEvent$))
                .subscribe({
                    next: ({ event }) => {
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

                        followees = event.tags
                            .filter((tag) => tag[0] === 'p')
                            .map((tag) => tag[1]);

                        subscribeTimeline();
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });

            // 古いイベントの購読
            const rxReqOlderTimelineBatched = rxReqOlderTimeline.pipe(bufferTime(loadBufferTime), batch());
            olderTimelineSub = rxNostr!
                .use(rxReqOlderTimelineBatched)
                .pipe(uniq(flushesOlderTimeline$))
                .subscribe({
                    next: ({ event }) => processHomeTimeline(event),
                    complete: () => {
                        console.log('Complete load old event');
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesOlderTimeline$.next();

            // 古いリアクションの購読
            const rxReqOlderReactionBatched = rxReqOlderReaction.pipe(bufferTime(loadBufferTime), batch());
            olderReactionSub = rxNostr!
                .use(rxReqOlderReactionBatched)
                .pipe(uniq(flushesOlderReaction$))
                .subscribe({
                    next: ({ event }) => processOlderReaction(event),
                    complete: () => {
                        console.log('Complete load old reaction');
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesOlderReaction$.next();

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
    olderReactionSub?.unsubscribe();
    rxNostr?.dispose();

    timelineSub = undefined;
    profileSub = undefined;
    rxReqTimeline = null;
    rxReqProfile = null;
    rxReqRelay = null;
    rxReqEvent = null;
    rxReqFollow = null;
    rxReqOlderTimeline = null;
    rxReqOlderReaction = null;
    rxNostr = null;
    signer = null;
    pubkey = null;
    followees = [];

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

export function emitOlderReaction() {
    let limit = loadLimit;
    if (maxTimeline - nostrState.events.length < loadLimit) {
        limit = maxTimeline - nostrState.events.length;
    }

    let until = now();
    if (nostrState.notifications.length > 0) {
        until = nostrState.notifications[-1].created_at;
    }

    rxReqOlderReaction?.emit({
        kinds: [1, 5, 6, 7, 16],
        '#p': [pubkey!],
        until,
        limit,
    });
}

export function emitOlderTimeline() {
    let limit = loadLimit;
    if (maxTimeline - nostrState.events.length < loadLimit) {
        limit = maxTimeline - nostrState.events.length;
    }

    rxReqOlderTimeline.emit({
        kinds: [1, 5, 6, 16],
        authors: followees,
        until: nostrState.events.at(-1)?.created_at ?? now(),
        limit: limit,
    });
}

export function getSigner(): EventSigner | null {
    return signer;
}

function processEvent(event: Event) {
    const nostrEvent: NostrEvent = { ...event };

    addEvent(nostrEvent);
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

    const isReferenceMe = getRefPubkeys(event).filter((key) => key === pubkey!).length > 0;
    if (isReferenceMe) {
        addNotification(nostrEvent);
    }
}

function processDelete(event: Event) {
    const ids = getRefIds(event);
    if (ids.length == 0) return;

    nostrState.events = nostrState.events.filter((ev) => ev.id !== ids[0]);
}

function processReaction(event: Event) {
    const nostrEvent: NostrEvent = { ...event };

    addEvent(nostrEvent);
    addNotification(nostrEvent);
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };
}

function processHomeTimeline(event: Event) {
    if (event.kind === 1 || event.kind === 6 || event.kind === 16) processEvent(event);
    else if (event.kind === 5) processDelete(event);
    else if (event.kind === 7) processReaction(event);
}

function processOlderReaction(event: Event) {
    const nostrEvent: NostrEvent = { ...event };
    addNotification(nostrEvent);
}

function subscribeTimeline() {
    emitOlderTimeline();
    emitOlderReaction();

    rxReqTimeline.emit([
        {
            kinds: [1, 5, 6, 16],
            authors: followees,
            since: now,
        },
        {
            kinds: [7],
            '#p': [pubkey!],
            since: now,
        },
    ]);
}

function addNotification(event: NostrEvent) {
    const index = nostrState.notifications.findIndex((ev) => ev.created_at < event.created_at);
    if (index < 0) {
        nostrState.notifications = [...nostrState.notifications, event].slice(0, maxTimeline);
    } else {
        nostrState.notifications = nostrState.notifications.toSpliced(index, 0, event).slice(0, maxTimeline);
    }
}

function addEvent(event: NostrEvent) {
    const index = nostrState.events.findIndex((ev) => ev.created_at < event.created_at);
    if (index < 0) {
        nostrState.events = [...nostrState.events, event].slice(0, maxTimeline);
    } else {
        nostrState.events = nostrState.events.toSpliced(index, 0, event).slice(0, maxTimeline);
    }
}
