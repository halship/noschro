import { TIMELINE_LIMIT } from './constants';
import type { Profile } from './models/profile';
import type { NostrEvent } from './nostr_type';
import { requestProfiles } from './subscriptions/profiles';

export type AppState = {
	eventsById: Record<string, NostrEvent>;
	profilesByPubkey: Record<string, Profile>;
	timelineIds: string[];
};

export const appState = $state<AppState>({
	eventsById: {},
	profilesByPubkey: {},
	timelineIds: []
});

export function addEvent(event: NostrEvent) {
	if (!(event.pubkey in appState.profilesByPubkey)) {
		requestProfiles([event.pubkey]);
	}

	appState.eventsById = { ...appState.eventsById, [event.id]: event };

	if (appState.timelineIds.includes(event.id)) return;

	const createdAt = appState.eventsById[event.id].created_at;

	const index = appState.timelineIds.findIndex((id) => {
		return appState.eventsById[id].created_at < createdAt;
	});

	if (index === -1) {
		appState.timelineIds = [...appState.timelineIds, event.id];
		return;
	}

	appState.timelineIds = [
		...appState.timelineIds.slice(0, index),
		event.id,
		...appState.timelineIds.slice(index)
	];

	if (appState.timelineIds.length > TIMELINE_LIMIT) {
		appState.timelineIds = appState.timelineIds.slice(0, TIMELINE_LIMIT);
	}
}
