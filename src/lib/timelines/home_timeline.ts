import { kindPost, loadLimit } from "$lib/consts";
import { nostrState } from "$lib/state.svelte";
import { now, type LazyFilter } from "rx-nostr";

export function getHomeTimelineFilter(): LazyFilter[] {
    return [
        {
            kinds: [kindPost],
            authors: nostrState.followees,
            since: now(),
        }
    ];
}

export function getHomeOldTimelineFilter(): LazyFilter[] {
    const until = nostrState.events.length > 0 ? nostrState.events.slice(-1)[0].created_at : now();
    return [
        {
            kinds: [kindPost],
            authors: nostrState.followees,
            until: until,
            limit: loadLimit,
        }
    ];
}