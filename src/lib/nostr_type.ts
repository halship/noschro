import * as Nostr from 'nostr-typedef';
import { NOSTR_URI_RE } from './models/token';
import { decodeNostrURI } from 'nostr-tools/nip19';

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

	const decodedCodes = event.content
		.matchAll(NOSTR_URI_RE)
		.map((match) => decodeNostrURI(match[1]))
		.toArray();

	const quotedIds = decodedCodes
		.filter((code) => code.type === 'nevent' || code.type === 'note')
		.map((code) => {
			if (code.type === 'nevent') {
				return code.data.id;
			} else {
				return code.data;
			}
		});

	const contentPubkeys = decodedCodes
		.filter((code) => code.type === 'npub')
		.map((code) => code.data);

	return {
		...event,
		replyToId: replyToId ? replyToId : rootId,
		replyToPubkeys,
		quotedIds,
		contentPubkeys
	};
}
