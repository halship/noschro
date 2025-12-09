import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, now, uniq, type LazyFilter, type RxNostr } from "rx-nostr";
import { seckeySigner, verifier } from "@rx-nostr/crypto";
import { bufferTime, Subject, Subscription } from "rxjs";
import { browser } from "$app/environment";
import type { NostrEvent, NostrProfile, NostrRef } from "$lib/types/nostr";
import { nostrState } from "./state.svelte";

let rxNostr: RxNostr | null = null;

let rxReqTimeline: any | null = null;
let rxReqProfile: any | null = null;
let rxReqDelete: any | null = null;
let rxReqRelay: any | null = null;
let rxReqEvent: any | null = null;
let rxReqFollow: any | null = null;

const flushesTimeline$ = new Subject<void>();
const flushesProfile$ = new Subject<void>();
const flushesDelete$ = new Subject<void>();
const flushesRelay$ = new Subject<void>();
const flushesEvent$ = new Subject<void>();
const flushesFollow$ = new Subject<void>();

let timelineSub: Subscription | null = null;
let profileSub: Subscription | null = null;
let deleteSub: Subscription | null = null;
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
                connectionStrategy: "lazy-keep",
            });

            rxNostr.setDefaultRelays(['wss://yabu.me']);

            rxReqTimeline = createRxForwardReq();
            rxReqProfile = createRxForwardReq();
            rxReqDelete = createRxForwardReq();
            rxReqRelay = createRxBackwardReq();
            rxReqEvent = createRxBackwardReq();
            rxReqFollow = createRxBackwardReq();

            // タイムライン購読
            timelineSub = rxNostr.use(rxReqTimeline)
                .pipe(uniq(flushesTimeline$))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 1) return;
                        if (event.id in nostrState.eventsById) return;

                        if (!(event.pubkey in nostrState.profiles)) {
                            rxReqProfile?.emit({
                                kinds: [0],
                                authors: [event.pubkey],
                                limit: 1
                            });
                        }

                        const nostrEvent: NostrEvent = { ...event };
                        nostrState.events = [nostrEvent, ...nostrState.events]
                            .toSorted((a, b) => b.created_at - a.created_at);
                        nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

                        const refId = event.tags.filter((tag) => tag[0] === 'e');
                        const refPubkey = event.tags.filter((tag) => tag[0] === 'p');
                        if (refId.length !== 0 && refPubkey.length !== 0) {
                            const nostrRef: NostrRef = {
                                id: refId[0][1],
                                pubkey: refPubkey[0][1],
                            };
                            nostrState.nostrRefs = { ...nostrState.nostrRefs, [event.id]: nostrRef };
                        }
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
                                about: meta.about
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

            // 削除イベント購読
            deleteSub = rxNostr
                .use(rxReqDelete)
                .pipe(uniq(flushesDelete$))
                .subscribe({
                    next: ({ event }) => {
                        if (event.kind !== 5) return;

                        const ids = event.tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]);
                        if (ids.length == 0) return;

                        nostrState.events = nostrState.events.filter((ev) => ev.id !== ids[0]);
                    },
                    error: (err) => {
                        console.error(err);
                    }
                });
            flushesDelete$.next();

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
                        nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

                        const refId = event.tags.filter((tag) => tag[0] === 'e');
                        const refPubkey = event.tags.filter((tag) => tag[0] === 'p');
                        if (refId.length !== 0 && refPubkey.length !== 0) {
                            const nostrRef: NostrRef = {
                                id: refId[0][1],
                                pubkey: refPubkey[0][1],
                            };
                            nostrState.nostrRefs = { ...nostrState.nostrRefs, [event.id]: nostrRef };
                        }
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
                            kinds: [1],
                            authors: follows,
                            limit: 20
                        });
                    },
                    error: (err) => {
                        console.error(err);
                    },
                });
            flushesFollow$.next();

            rxReqDelete.emit({
                kinds: [5],
                limit: 20
            });

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
    deleteSub?.unsubscribe();
    relaySub?.unsubscribe();
    eventSub?.unsubscribe();
    followSub?.unsubscribe();
    rxNostr?.dispose();

    timelineSub = null;
    profileSub = null;
    deleteSub = null;
    rxReqTimeline = null;
    rxReqProfile = null;
    rxReqDelete = null;
    rxReqRelay = null;
    rxReqEvent = null;
    rxReqFollow = null;
    rxNostr = null;

    nostrState.events = [];
    nostrState.eventsById = {};
    nostrState.nostrRefs = {};
    nostrState.profiles = {};
}

export function emitEvent(filter: LazyFilter) {
    rxReqEvent?.emit(filter);
}

export function emitProfile(filter: LazyFilter) {
    rxReqProfile?.emit(filter);
}

export function emitDelete(filter: LazyFilter) {
    rxReqDelete?.emit(filter);
}
