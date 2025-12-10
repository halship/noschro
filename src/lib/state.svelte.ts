import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    authoricated: false,
    followees: [],
    events: [],
    eventsById: {},
    profiles: {},
    notifications: [],
});
