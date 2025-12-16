import { kindDelete, kindGeneralRepost, kindMetaData, kindPost, kindReaction, kindRepost, kindsEvent, loadBufferTime, loadLimit, maxTimelineNum } from "$lib/consts";
import { pubkey } from "$lib/signer";
import { nostrState } from "$lib/state.svelte";
import { batch, createRxBackwardReq, createRxForwardReq, now, uniq, type LazyFilter } from "rx-nostr";
import { bufferTime, Subject, Subscription } from "rxjs";
import { rxNostr, rxReqEvent, rxReqProfiles } from "./base_timeline";
import type { Event } from "nostr-tools";
import { getAddr } from "$lib/util";

export const rxReqTimeline = createRxForwardReq();
export const rxReqOldTimeline = createRxBackwardReq();
export let flushesTimeline$ = new Subject<void>();

let timelineSub: Subscription | undefined = undefined;
let oldTimelineSub: Subscription | undefined = undefined;

export function subscribeHome() {
    // タイムライン取得
    timelineSub = rxNostr?.use(rxReqTimeline)
        .pipe(uniq(flushesTimeline$))
        .subscribe({
            next: ({ event }) => setTimeline(event),
            error: (err) => {
                console.error(err);
            }
        });

    // 古いタイムライン取得
    const rxReqOldTimelineBatched = rxReqOldTimeline.pipe(bufferTime(loadBufferTime), batch());
    oldTimelineSub = rxNostr?.use(rxReqOldTimelineBatched)
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

    if (nostrState.events.length === 0) {
        rxReqOldTimeline.emit(getHomeOldTimelineFilter());
    }
    nostrState.timelineNum = loadLimit;
    rxReqTimeline.emit(getHomeTimelineFilter());
}

export function unsubscribeHome() {
    timelineSub?.unsubscribe();
    oldTimelineSub?.unsubscribe();
}

export function getHomeTimelineFilter(): LazyFilter[] {
    const since = nostrState.events.length > 0 ? nostrState.events[0].created_at + 1 : now();
    return [
        {
            kinds: kindsEvent,
            authors: nostrState.followees,
            since,
        },
        {
            kinds: [kindReaction],
            '#p': [pubkey!],
            since,
        },
        {
            kinds: [kindReaction],
            authors: [pubkey!],
            since,
        }
    ];
}

export function getHomeOldTimelineFilter(limit?: number): LazyFilter[] {
    const until = nostrState.events.length > 0 ? nostrState.events.slice(-1)[0].created_at - 1 : now();
    const since = until - getLoadTime();
    return [
        {
            kinds: kindsEvent,
            authors: nostrState.followees,
            until,
            since: limit ? undefined : since,
            limit,
        },
        {
            kinds: [kindReaction],
            '#p': [pubkey!],
            until,
            since: limit ? undefined : since,
            limit,
        },
        {
            kinds: [kindReaction],
            authors: [pubkey!],
            until,
            since: limit ? undefined : since,
            limit,
        }
    ];
}

function getLoadTime(): number {
    if (nostrState.followees.length < 50) {
        return 1200;
    } else {
        return 600;
    }
}

function setTimeline(event: Event) {
    // 削除イベントの場合、タイムラインから該当イベントを削除
    if (event.kind === kindDelete) {
        deleteEvent(event);
        return;
    }

    // ユーザがしたアクションの場合、履歴に追加
    if ((event.kind === kindRepost || event.kind === kindGeneralRepost) &&
        event.pubkey === pubkey!) {
        const id = event.tags.filter((t) => t[0] === 'e').map((t) => t[1]).at(0);
        nostrState.repostsById = { ...nostrState.repostsById, [id!]: event.id };
    }
    if ((event.kind === kindReaction) && event.pubkey === pubkey!) {
        const id = event.tags.filter((t) => t[0] === 'e').map((t) => t[1]).at(0);
        nostrState.reactionsById = { ...nostrState.reactionsById, [id!]: event.id };
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