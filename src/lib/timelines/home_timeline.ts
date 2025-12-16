import { kindGeneralRepost, kindPost, kindReaction, kindRepost, kindsEvent, loadLimit, maxTimelineNum } from "$lib/consts";
import { pubkey } from "$lib/signer";
import { nostrState } from "$lib/state.svelte";
import type { NotifyType } from "$lib/types/nostr";
import { now, type LazyFilter } from "rx-nostr";

export function getHomeTimelineFilter(): LazyFilter[] {
    const since = nostrState.events.length > 0 ? nostrState.events[0].created_at : now();
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
    const until = nostrState.events.length > 0 ? nostrState.events.slice(-1)[0].created_at : now();
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

export function getNotificationsFilter(notifyType: NotifyType): LazyFilter {
    const until = nostrState.notifications.length > 0 ? nostrState.notifications.slice(-1)[0].created_at : now();
    const limit = maxTimelineNum - nostrState.notifications.length < loadLimit ? maxTimelineNum - nostrState.notifications.length : loadLimit;

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
            kinds: [...kindsEvent, kindReaction],
            '#p': [pubkey!],
            until,
            limit,
        };
    }
}

function getLoadTime(): number {
    if (nostrState.followees.length < 50) {
        return 1200;
    } else {
        return 600;
    }
}