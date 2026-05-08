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
