import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, uniq, type RxNostr } from "rx-nostr";
import { verifier } from "@rx-nostr/crypto";
import { defaultRelays, kindDelete, kindFollowList, kindMetaData, kindPost, kindRelayList, kindsEvent, loadBufferTime, loadLimit } from "$lib/consts";
import { bufferTime, Subject, type Subscription } from "rxjs";
import { nostrState } from "$lib/state.svelte";
import type { Event } from "nostr-typedef";
import { signer, pubkey } from "$lib/signer";
import type { NostrEvent, NostrProfile, NostrRelay } from "$lib/types/nostr";
import { getAddr } from "$lib/util";

export const rxReqTimeline = createRxForwardReq();
export const rxReqOldTimeline = createRxBackwardReq();
export const rxReqRelays = createRxBackwardReq();
export const rxReqFollow = createRxBackwardReq();
export const rxReqProfiles = createRxForwardReq();
export const rxReqEvent = createRxBackwardReq();
export const rxReqOldNotifications = createRxBackwardReq();

export let flushesTimeline$ = new Subject<void>();
export let flushesProfiles$ = new Subject<void>();
export let flushesNotifications$ = new Subject<void>();

export let rxNostr: RxNostr | null = null;

let timelineSub: Subscription | null = null;
let oldTimelineSub: Subscription | null = null;
let profilesSub: Subscription | null = null;
let relaysSub: Subscription | null = null;
let followSub: Subscription | null = null;
let eventSub: Subscription | null = null;
let oldNotificationsSub: Subscription | null = null;

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

    // タイムライン取得
    timelineSub = rxNostr.use(rxReqTimeline)
        .pipe(uniq(flushesTimeline$))
        .subscribe({
            next: ({ event }) => setTimeline(event),
            error: (err) => {
                console.error(err);
            }
        });

    // 古いタイムライン取得
    const rxReqOldTimelineBatched = rxReqOldTimeline.pipe(bufferTime(loadBufferTime), batch());
    oldTimelineSub = rxNostr.use(rxReqOldTimelineBatched)
        .pipe(uniq(flushesTimeline$))
        .subscribe({
            next: ({ event }) => {
                nostrState.timelineNum += loadLimit;
                setTimeline(event);
            },
            error: (err) => {
                console.error(err);
            }
        });

    // プロフィール取得
    const rxReqProfilesBatched = rxReqProfiles
        .pipe(bufferTime(loadBufferTime), batch());
    profilesSub = rxNostr.use(rxReqProfilesBatched)
        .pipe(uniq(flushesProfiles$))
        .subscribe({
            next: ({ event }) => {
                if ((event.pubkey in nostrState.profiles) &&
                    nostrState.profiles[event.pubkey].created_at > event.created_at) {
                    return;
                }

                try {
                    const meta = JSON.parse(event.content) as {
                        name?: string;
                        display_name?: string;
                        picture?: string;
                        banner?: string;
                        about?: string;
                    };

                    const profile: NostrProfile = {
                        pubkey: event.pubkey,
                        tags: event.tags,
                        created_at: event.created_at,
                        name: meta.name,
                        display_name: meta.display_name,
                        picture: meta.picture,
                        banner: meta.banner,
                        about: meta.about,
                    };

                    nostrState.profiles = { ...nostrState.profiles, [event.pubkey]: profile };
                } catch (err) {
                    console.error('Failed to parse profile metadata');
                }
            }
        });

    // イベント取得
    const rxReqEventBatched = rxReqEvent.pipe(bufferTime(loadBufferTime), batch());
    eventSub = rxNostr.use(rxReqEventBatched)
        .pipe(uniq(flushesTimeline$))
        .subscribe({
            next: ({ event }) => {
                if (event.id in nostrState.eventsById) {
                    return;
                }

                const nostrEvent: NostrEvent = { ...event };
                nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

                if (!(event.pubkey in nostrState.profiles)) {
                    rxReqProfiles.emit({
                        kinds: [kindMetaData],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }

                const identifiers = event.tags.filter((t) => t[0] === 'd')
                    .map((t) => t[1]);
                if (identifiers.length > 0) {
                    const key = getAddr(event.kind, event.pubkey, identifiers[0]);
                    nostrState.eventsByAddr = { ...nostrState.eventsByAddr, [key]: nostrEvent };
                }
            },
            error: (err) => {
                console.error(err);
            }
        });

    // 古い通知を取得
    oldNotificationsSub = rxNostr.use(rxReqOldNotifications)
        .pipe(uniq(flushesNotifications$))
        .subscribe({
            next: ({ event }) => {
                const nostrEvent: NostrEvent = { ...event };
                const index = nostrState.notifications
                    .findIndex((ev) => ev.created_at < event.created_at);
                if (index < 0) {
                    nostrState.notifications = [...nostrState.notifications, nostrEvent]
                        .slice(0, nostrState.timelineNum);
                } else {
                    nostrState.notifications = nostrState.notifications
                        .toSpliced(index, 0, nostrEvent)
                        .slice(0, nostrState.timelineNum);
                }

                if (!(event.pubkey in nostrState.profiles)) {
                    rxReqProfiles.emit({
                        kinds: [kindMetaData],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }
            },
            error: (err) => {
                console.error(err);
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
    relaysSub?.unsubscribe();
    relaysSub = null;
    followSub?.unsubscribe();
    followSub = null;
    eventSub?.unsubscribe();
    eventSub = null;
    oldNotificationsSub?.unsubscribe();
    oldNotificationsSub = null;

    flushesTimeline$.next();
    flushesProfiles$.next();
    flushesNotifications$.next();

    rxNostr?.dispose();
    rxNostr = null;
}

function setTimeline(event: Event) {
    // 削除イベントの場合、タイムラインから該当イベントを削除
    if (event.kind === kindDelete) {
        deleteEvent(event);
        return;
    }

    const nostrEvent = { ...event };

    // イベントをタイムラインに追加
    const index = nostrState.events
        .findIndex((ev) => ev.created_at < nostrEvent.created_at);
    if (index < 0) {
        nostrState.events = [...nostrState.events, nostrEvent].slice(0, nostrState.timelineNum);
    } else {
        nostrState.events = nostrState.events
            .toSpliced(index, 0, nostrEvent).slice(0, nostrState.timelineNum);
    }

    // イベントをイベント履歴に追加
    nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

    // dがタグに定義されている場合、アドレスで検索できるイベント履歴にイベントを追加
    const identifiers = event.tags.filter((t) => t[0] === 'd')
        .map((t) => t[1]);
    if (identifiers.length > 0) {
        const key = getAddr(event.kind, event.pubkey, identifiers[0]);
        nostrState.eventsByAddr = { ...nostrState.eventsByAddr, [key]: nostrEvent };
    }

    if (!(event.pubkey in nostrState.profiles)) {
        rxReqProfiles.emit({
            kinds: [kindMetaData],
            authors: [event.pubkey],
            limit: 1,
        });
    }

    const ids = event.tags
        .filter((t) => t[0] === 'e' && !(t[1] in nostrState.eventsById))
        .map((t) => t[1]);
    if (ids.length > 0) {
        rxReqEvent.emit({
            kinds: kindsEvent,
            ids: ids,
            limit: ids.length
        });
    }

    const pubkeys = event.tags
        .filter((t) => t[0] === 'p' && !(t[1] in nostrState.profiles))
        .map((t) => t[1]);
    if (pubkeys.length > 0) {
        rxReqProfiles.emit({
            kinds: [kindMetaData],
            authors: pubkeys,
            limit: pubkeys.length,
        });
    }
}

function deleteEvent(event: Event) {
    const ids = event.tags
        .filter((t) => t[0] === 'e' || t[0] === 'a')
        .map((t) => t[0]);

    nostrState.events = nostrState.events.filter((ev) => !ids.includes(ev.id));
}

function getRelays(rx: RxNostr): Promise<NostrRelay[]> {
    return new Promise((resolve) => {
        relaysSub = rx.use(rxReqRelays)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const relays = event.tags.filter((t) => t[0] === 'r')
                        .map((t) => {
                            if (t.length < 3) {
                                return { url: t[1], read: true, write: true };
                            } else if (t[2] === 'read') {
                                return { url: t[1], read: true, write: false };
                            } else {
                                return { url: t[1], read: false, write: true };
                            }
                        });

                    console.log(`[${kindRelayList}] Set default relays`);
                    for (const relay of relays) {
                        console.log(relay.url);
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
        followSub = rx.use(rxReqFollow)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const followees = event.tags.filter((t) => t[0] === 'p')
                        .map((t) => t[1]);

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

function emitReferences(tags: string[][]) {
    const ids = tags
        .filter((t) => t[0] === 'e' && !(t[1] in nostrState.eventsById))
        .map((t) => t[1]);
    if (ids.length > 0) {
        rxReqEvent.emit({
            kinds: [kindPost],
            ids: ids,
            limit: ids.length
        });
    }

    const pubkeys = tags
        .filter((t) => t[0] === 'p' && !(t[1] in nostrState.profiles))
        .map((t) => t[1]);
    if (pubkeys.length > 0) {
        rxReqProfiles.emit({
            kinds: [kindMetaData],
            authors: pubkeys,
            limit: 1
        });
    }
}
