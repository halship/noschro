import { kindGeneralRepost, kindPost, kindReaction, kindRepost, kindsEvent, loadLimit, maxTimelineNum } from "$lib/consts";
import { pubkey } from "$lib/signer";
import { nostrState } from "$lib/state.svelte";
import type { NotifyType } from "$lib/types/nostr";
import { now, type LazyFilter } from "rx-nostr";

export function getHomeTimelineFilter(): LazyFilter[] {
    return [
        {
            kinds: kindsEvent,
            authors: nostrState.followees,
            since: now(),
        },
        {
            kinds: [kindReaction],
            '#p': [pubkey!],
            since: now(),
        }
    ];
}

export function getHomeOldTimelineFilter(): LazyFilter[] {
    const until = nostrState.events.length > 0 ? nostrState.events.slice(-1)[0].created_at : now();
    return [
        {
            kinds: [...kindsEvent, kindReaction],
            authors: nostrState.followees,
            until,
            limit: loadLimit,
        }
    ];
}

export function getNotificationsFilter(notifyType: NotifyType): LazyFilter {
    const until = nostrState.events.length > 0 ? nostrState.events.slice(-1)[0].created_at : now();
    const limit = maxTimelineNum - nostrState.events.length < loadLimit ? maxTimelineNum - nostrState.events.length : loadLimit;

    if (notifyType === 'mentions') {
        return {
            kinds: [kindPost],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else if (notifyType === 'reactions') {
        return {
            kinds: [kindReaction],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else if (notifyType === 'reposts') {
        return {
            kinds: [kindRepost, kindGeneralRepost],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else {
        return {
            kinds: [kindPost],
            '#p': [pubkey!],
            until,
            limit,
        };
    }
}