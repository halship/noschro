import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    authoricated: false,
    events: [],
    eventsById: {},
    profiles: {},
    notifications: [],
    eventsByAddr: [],
});
