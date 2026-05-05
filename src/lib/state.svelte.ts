import { TIMELINE_LIMIT } from './constants';
import type { Profile } from './models/profile';
import type { NostrEvent } from './nostr_type';

export type AppState = {
	eventsById: Record<string, NostrEvent>;
	profilesByPubkey: Record<string, Profile>;
	timelineIds: string[];
	isOpenedSetting: boolean;
};

export const appState = $state<AppState>({
	eventsById: {},
	profilesByPubkey: {},
	timelineIds: [],
	isOpenedSetting: false
});

export function addEventToTimeline(event: NostrEvent) {
	appState.eventsById = { ...appState.eventsById, [event.id]: event };

	const createdAt = appState.eventsById[event.id].created_at;

	const index = appState.timelineIds.findIndex((id) => {
		return appState.eventsById[id].created_at < createdAt;
	});

	if (index === -1) {
		appState.timelineIds = [...appState.timelineIds, event.id];
	} else {
		appState.timelineIds = [
			...appState.timelineIds.slice(0, index),
			event.id,
			...appState.timelineIds.slice(index)
		];
	}

	if (appState.timelineIds.length > TIMELINE_LIMIT) {
		appState.timelineIds = appState.timelineIds.slice(0, TIMELINE_LIMIT);
	}
}
