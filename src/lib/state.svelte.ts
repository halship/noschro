import { loadLimit } from "./consts";
import type { NostrState } from "./types/nostr";

export const nostrState: NostrState = $state({
    events: [],
    eventsById: {},
    eventsByAddr: {},
    profiles: {},
    userGeneralStatuses: {},
    actionsById: {},
    notifications: [],
    relays: [],
    followees: [],
    isAuthoricated: false,
    timelineNum: loadLimit,
});

export function clearState() {
    nostrState.events = [];
    nostrState.eventsById = {};
    nostrState.eventsByAddr = {};
    nostrState.profiles = {};
    nostrState.userGeneralStatuses = {};
    nostrState.actionsById = {};
    nostrState.notifications = [];
    nostrState.relays = [];
    nostrState.followees = [];
    nostrState.timelineNum = loadLimit;
}