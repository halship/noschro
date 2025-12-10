import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, now, sortEvents, uniq, type LazyFilter, type RxNostr } from "rx-nostr";
import { seckeySigner, verifier } from "@rx-nostr/crypto";
import { bufferTime, Subject, Subscription } from "rxjs";
import { browser } from "$app/environment";
import type { NostrEvent, NostrProfile, NostrRef } from "$lib/types/nostr";
import { nostrState } from "./state.svelte";
import type { Event } from "nostr-tools";

let rxNostr: RxNostr | null = null;

let rxReqTimeline: any | null = null;
let rxReqProfile: any | null = null;
let rxReqRelay: any | null = null;
let rxReqEvent: any | null = null;
let rxReqFollow: any | null = null;

const flushesTimeline$ = new Subject<void>();
const flushesProfile$ = new Subject<void>();
const flushesRelay$ = new Subject<void>();
const flushesEvent$ = new Subject<void>();
const flushesFollow$ = new Subject<void>();

let timelineSub: Subscription | null = null;
let profileSub: Subscription | null = null;
let relaySub: Subscription | null = null;
let eventSub: Subscription | null = null;
let followSub: Subscription | null = null;

export function connectNostr(): boolean {
    if (rxNostr) return true;

    if (browser) {
        const savedLogin = localStorage.getItem('login');

        if (savedLogin === null) return false;

        if (savedLogin!!.startsWith('nsec')) {
            const signer = seckeySigner(savedLogin!!);

            rxNostr = createRxNostr({
                verifier,
                signer,
            });

            rxNostr.setDefaultRelays(['wss://yabu.me']);

            rxReqTimeline = createRxForwardReq();
            rxReqProfile = createRxForwardReq();
            rxReqRelay = createRxBackwardReq();
            rxReqEvent = createRxBackwardReq();
            rxReqFollow = createRxBackwardReq();

            // タイムライン購読
            timelineSub = rxNostr.use(rxReqTimeline)
                .pipe(uniq(flushesTimeline$), sortEvents(3000))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 1 && event.kind !== 5 && event.kind !== 6 && event.kind !== 16) return;
                        if (event.id in nostrState.eventsById) return;

                        if (event.kind === 1) processNote(event);
                        if (event.kind === 5) processDelete(event);
                        if (event.kind === 6 || event.kind === 16) processRepost(event);
                    },
                    error: (err) => {
                        console.log(err);
                    },
                });
            flushesTimeline$.next();

            // プロフィール購読
            const rxReqProfileBatched = rxReqProfile.pipe(bufferTime(1000), batch());
            profileSub = rxNostr
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
                                tags?: string[][];
                            };

                            const profile: NostrProfile = {
                                pubkey: event.pubkey,
                                name: meta.name,
                                display_name: meta.display_name,
                                picture: meta.picture,
                                about: meta.about,
                                tags: meta.tags ?? [],
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
            relaySub = rxNostr
                .use(rxReqRelay)
                .pipe(uniq(flushesRelay$))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 10002) return;

                        const relays = event.tags.filter((tag) => tag[0] === 'r')
                            .map((tag) => tag[1]);

                        rxNostr?.setDefaultRelays(relays);
                    }
                });
            flushesRelay$.next();

            // 個別投稿取得
            const rxReqEventBatched = rxReqEvent.pipe(bufferTime(1000), batch());
            eventSub = rxNostr
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

                        const refId = event.tags.filter((tag) => tag[0] === 'e');
                        const refPubkey = event.tags.filter((tag) => tag[0] === 'p');
                        if (refId.length !== 0 && refPubkey.length !== 0) {
                            nostrEvent.reference = { id: refId[0][1], pubkey: refPubkey[0][1] };
                        }

                        nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };
                    },
                    error: (err) => {
                        console.error(err);
                    }
                });
            flushesEvent$.next();

            // フォローリスト購読
            followSub = rxNostr.use(rxReqFollow)
                .pipe(uniq(flushesFollow$))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 3) return;

                        const follows = event.tags
                            .filter((tag) => tag[0] === 'p')
                            .map((tag) => tag[1]);

                        rxReqTimeline.emit({
                            kinds: [1, 5, 6, 16],
                            authors: follows,
                            limit: 20
                        });
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesFollow$.next();

            setTimeout(async () => {
                rxReqRelay.emit({
                    kinds: [10002],
                    authors: [await signer.getPublicKey()],
                    limit: 1
                });
                rxReqFollow.emit({
                    kinds: [3],
                    authors: [await signer.getPublicKey()],
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
    rxNostr?.dispose();

    timelineSub = null;
    profileSub = null;
    rxReqTimeline = null;
    rxReqProfile = null;
    rxReqRelay = null;
    rxReqEvent = null;
    rxReqFollow = null;
    rxNostr = null;

    nostrState.events = [];
    nostrState.eventsById = {};
    nostrState.profiles = {};
}

export function emitEvent(filter: LazyFilter) {
    rxReqEvent?.emit(filter);
}

export function emitProfile(filter: LazyFilter) {
    rxReqProfile?.emit(filter);
}

function processNote(event: Event) {
    if (!(event.pubkey in nostrState.profiles)) {
        rxReqProfile?.emit({
            kinds: [0],
            authors: [event.pubkey],
            limit: 1
        });
    }

    const nostrEvent: NostrEvent = { ...event };
    const refId = event.tags.filter((tag) => tag[0] === 'e');
    const refPubkey = event.tags.filter((tag) => tag[0] === 'p');
    if (refId.length !== 0 && refPubkey.length !== 0) {
        nostrEvent.reference = { id: refId[0][1], pubkey: refPubkey[0][1] };
    }

    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, 100);
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };
}

function processDelete(event: Event) {
    const ids = event.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1]);

    if (ids.length == 0) return;

    nostrState.events = nostrState.events.filter((ev) => ev.id !== ids[0]);
}

function processRepost(event: Event) {
    if (!(event.pubkey in nostrState.profiles)) {
        rxReqProfile?.emit({
            kinds: [0],
            authors: [event.pubkey],
            limit: 1
        });
    }

    const nostrEvent: NostrEvent = { ...event };
    const repostId = nostrEvent.tags.filter((tag) => tag[0] === 'e')
        .map((tag) => tag[1])[0];
    nostrEvent.repost_id = repostId;

    if (!(repostId in nostrState.eventsById)) {
        rxReqEvent?.emit({
            kinds: [1],
            ids: [repostId],
            limit: 1
        });
    }

    nostrState.events = [nostrEvent, ...nostrState.events].slice(0, 100);
}
