import { TIMELINE_LIMIT } from './constants';
import type { Profile } from './models/profile';
import type { NostrEvent } from './nostr_type';

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

export function addEventToTimeline(event: NostrEvent) {
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

export function getReplyToIds(id: string): string[] {
	let ids = [id];

	while (ids[0] in appState.eventsById) {
		const event = appState.eventsById[ids[0]];

		if (event.replyToId) {
			ids = [event.replyToId, ...ids];
		} else if (event.rootId) {
			ids = [event.rootId, ...ids];
			break;
		} else {
			break;
		}
	}

	return ids;
}
