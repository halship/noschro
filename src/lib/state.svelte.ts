import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    events: [],
    eventsById: {},
    eventsByAddr: {},
    profiles: {},
    notifications: [],
    notificationsById: {},
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
    nostrState.notificationsById = {};
    nostrState.relays = [];
    nostrState.followees = [];
}