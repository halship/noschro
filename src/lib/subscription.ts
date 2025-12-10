import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, nip07Signer, now, sortEvents, uniq, type LazyFilter, type RxNostr } from "rx-nostr";
import { seckeySigner, verifier } from "@rx-nostr/crypto";
import { bufferTime, Subject, Subscription } from "rxjs";
import { browser } from "$app/environment";
import type { NostrEvent, NostrProfile, NostrRef } from "$lib/types/nostr";
import { nostrState } from "./state.svelte";
import type { Event } from "nostr-tools";
import type { EventSigner } from "@rx-nostr/crypto/src";
import { getRefPubkeys } from "./util";
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

export function connectNostr(): boolean {
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
            rxNostr = createRxNostr({
                verifier,
                signer,
            });

            rxNostr?.setDefaultRelays(['wss://yabu.me']);

            rxReqTimeline = createRxForwardReq();
            rxReqProfile = createRxForwardReq();
            rxReqRelay = createRxBackwardReq();
            rxReqEvent = createRxBackwardReq();
            rxReqFollow = createRxBackwardReq();
            rxReqOlderTimeline = createRxBackwardReq();

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
                        if (event.kind !== 1) return;
                        if (event.id in nostrState.eventsById) return;

                        if (!(event.pubkey in nostrState.profiles)) {
                            rxReqProfile.emit({
                                kinds: [0],
                                authors: [event.pubkey],
                                limit: 1
                            });
                        }

                        const nostrEvent: NostrEvent = { ...event };
                        nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };
                    },
                    error: (err) => {
                        console.error(err);
                    }
                });

            // フォローリスト購読
            followSub = rxNostr!.use(rxReqFollow)
                .pipe(latest())
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 3) return;

                        let pubkeys = event.tags
                            .filter((tag) => tag[0] === 'p')
                            .map((tag) => tag[1]);

                        nostrState.followees = pubkeys;

                        rxReqOlderTimeline.emit({
                            kinds: [1, 5, 6, 7, 16],
                            authors: nostrState.followees,
                            until: nostrState.events.at(-1)?.created_at ?? now(),
                            limit: 25,
                        });
                        rxReqTimeline.emit({
                            kinds: [1, 5, 6, 7, 16],
                            authors: nostrState.followees,
                            since: now,
                        });
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
                    next: ({ event }) => processHomeTimeline(event),
                    complete: () => {
                        nostrState.events = nostrState.events.toSorted((a, b) => b.created_at - a.created_at);
                        nostrState.notifications = nostrState.notifications.toSorted((a, b) => b.created_at - a.created_at);
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesOlderTimeline$.next();

            setTimeout(async () => {
                rxReqRelay.emit({
                    kinds: [10002],
                    authors: [await signer!.getPublicKey()],
                    until: now,
                    limit: 1
                });
                rxReqFollow.emit({
                    kinds: [3],
                    authors: [await signer!.getPublicKey()],
                    until: now,
                    limit: 1,
                });
            });

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
    nostrState.followees = [];
    nostrState.notifications = [];
}

export function emitEvent(ids: string[]) {
    rxReqEvent?.emit({
        kinds: [1],
        ids,
        limit: ids.length,
    });
}

export function emitProfile(authors: string[]) {
    rxReqProfile?.emit({
        kinds: [0],
        authors,
        limit: authors.length,
    });
}

export function getSigner(): EventSigner | null {
    return signer;
}

function processNote(event: Event) {
    const nostrEvent: NostrEvent = { ...event };
    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, maxTimeline);
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

    if (!(nostrEvent.pubkey in nostrState.profiles)) {
        emitProfile([nostrEvent.pubkey]);
    }

    setTimeout(async () => {
        const pubkey = await signer!.getPublicKey();

        if (getRefPubkeys(nostrEvent).includes(pubkey)) {
            nostrState.notifications = [nostrEvent, ...nostrState.notifications].slice(0, maxTimeline);
        }
    });
}

function processDelete(event: Event) {
    const ids = event.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1]);

    if (ids.length == 0) return;

    nostrState.events = nostrState.events.filter((ev) => ev.id !== ids[0]);
}

function processRepost(event: Event) {
    const nostrEvent: NostrEvent = { ...event };
    const pubkeys = getRefPubkeys(nostrEvent);
    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, maxTimeline);

    setTimeout(async () => {
        const myPubkey = await signer!.getPublicKey();

        if (pubkeys.includes(myPubkey)) {
            nostrState.notifications = [nostrEvent, ...nostrState.notifications].slice(0, maxTimeline);
        }
    }, 0);
}

function processReaction(event: Event) {
    setTimeout(async () => {
        const myPubkey = await signer!.getPublicKey();
        const nostrEvent: NostrEvent = { ...event };
        const pubkeys = getRefPubkeys(nostrEvent);

        if (pubkeys.includes(myPubkey)) {
            nostrState.events = [nostrEvent, ...nostrState.events].slice(0, maxTimeline);
            nostrState.notifications = [nostrEvent, ...nostrState.notifications].slice(0, maxTimeline);
        }
    }, 0);
}

function processHomeTimeline(event: Event) {
    if (event.kind === 1) processNote(event);
    if (event.kind === 5) processDelete(event);
    if (event.kind === 6 || event.kind === 16) processRepost(event);
    if (event.kind === 7) processReaction(event);
}
