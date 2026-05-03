import { TIMELINE_LIMIT } from './constants';
import type { NostrEvent } from './nostr_type';

export type AppState = {
	eventsById: Record<string, NostrEvent>;
	timelineIds: string[];
};

export const appState = $state<AppState>({
	eventsById: {},
	timelineIds: []
});

export function addEvent(event: NostrEvent) {
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
