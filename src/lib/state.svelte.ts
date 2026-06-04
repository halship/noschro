import * as Nostr from 'nostr-typedef';
import type { DefaultRelayConfig } from 'rx-nostr';

export type NostrState = {
	relays: DefaultRelayConfig[];
	followees: string[];
	eventsById: Record<string, Nostr.Event>;
	timelineIds: string[];
};

export const nostrState: NostrState = {
	relays: [],
	followees: [],
	eventsById: {},
	timelineIds: []
};
