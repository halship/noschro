import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    events: [],
    eventsById: {},
    eventsByAddr: {},
    profiles: {},
    notifications: [],
    relays: [],
    followees: [],
    isAuthoricated: false,
});

export function clearState() {
    nostrState.events = [];
    nostrState.eventsById = {};
    nostrState.eventsByAddr = {};
    nostrState.profiles = {};
    nostrState.notifications = [];
    nostrState.relays = [];
    nostrState.followees = [];
}