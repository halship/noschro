import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    authoricated: false,
    tlLoading: true,
    pubkey: null,
    events: [],
    eventsById: {},
    profiles: {},
    notifications: [],
});
