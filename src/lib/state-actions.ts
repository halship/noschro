import type { Profile } from './models/profile';
import type { NostrEvent } from './nostr_type';
import { appState } from './state.svelte';

export function upsertEvent(event: NostrEvent) {
	appState.eventsById = { ...appState.eventsById, [event.id]: event };
}

export function upsertProfile(profile: Profile) {
	appState.profilesByPubkey = {
		...appState.profilesByPubkey,
		[profile.pubkey]: profile
	};
}

export function getMissingEventIds(ids: string[]): string[] {
	return ids.filter((id) => !(id in appState.eventsById));
}

export function getMissingProfilePubkeys(pubkeys: string[]): string[] {
	return pubkeys.filter((pubkey) => !(pubkey in appState.profilesByPubkey));
}

export function hasTimelineEvent(id: string): boolean {
	return appState.timelineIds.includes(id);
}

export function resetTimelineIds() {
	appState.timelineIds = [];
}

export function addEventToTimeline(event: NostrEvent, limit: number) {
	upsertEvent(event);

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

	if (appState.timelineIds.length > limit) {
		appState.timelineIds = appState.timelineIds.slice(0, limit);
	}
}
