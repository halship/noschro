import * as Nostr from 'nostr-typedef';
import { extractContentPubkeys, extractQuoteIds } from './models/nostr-uri';

export type NostrRelay = {
	url: string;
	read: boolean;
	write: boolean;
};

export type NostrEvent = Nostr.Event & {
	replyToId?: string;
	replyToPubkeys: string[];
	quotedIds: string[];
	contentPubkeys: string[];
};

export function createEvent(event: Nostr.Event): NostrEvent {
	const refIds = event.tags.filter((tag) => tag[0] === 'e');
	const rootId = refIds.filter((tag) => tag[3] === 'root').map((tag) => tag[1])[0];
	const replyToId = refIds.filter((tag) => tag[3] === 'reply').map((tag) => tag[1])[0];
	const replyToPubkeys = event.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]);

	const quotedIds = extractQuoteIds(event.content);
	const contentPubkeys = extractContentPubkeys(event.content);

	return {
		...event,
		replyToId: replyToId ? replyToId : rootId,
		replyToPubkeys,
		quotedIds,
		contentPubkeys
	};
}
