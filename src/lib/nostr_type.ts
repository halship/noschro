import type * as Nostr from 'nostr-typedef';

export type NostrEvent = Nostr.Event & {
	rootId?: string;
	replyToId?: string;
};

export function createEvent(event: Nostr.Event): NostrEvent {
	const refIds = event.tags.filter((tag) => tag[0] === 'e');
	const rootId = refIds.filter((tag) => tag[3] === 'root').map((tag) => tag[1])[0];
	const replyToId = refIds.filter((tag) => tag[3] === 'reply').map((tag) => tag[1])[0];

	return {
		...event,
		rootId,
		replyToId
	};
}
