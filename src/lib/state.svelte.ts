import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    authoricated: false,
    tlLoading: true,
    events: [],
    eventsById: {},
    profiles: {},
    notifications: [],
});
