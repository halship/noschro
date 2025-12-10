import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    events: [],
    eventsById: {},
    profiles: {},
    mentions: [],
});
