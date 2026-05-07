import type { NostrEvent } from '$lib/nostr_type';
import { toPost } from './post';
import type { Profile } from './profile';
import type { Quote } from './quote';
import type { NostrUser } from './user';

export function getQuotes(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	quotedIds: string[]
): Record<string, Quote> | undefined {
	const quotes = quotedIds
		.filter((id) => id in eventsById)
		.map((id) => {
			const event = eventsById[id];
			const post = toPost(event);
			const profile = profilesByPubkey[post.pubkey];
			const quotes = getQuotes(eventsById, profilesByPubkey, event.quotedIds);
			return { post, profile, quotes };
		});

	return quotes.length > 0
		? quotes.reduce((result, quote) => {
				return { ...result, [quote.post.id]: quote };
			}, {})
		: undefined;
}

export function getContentUsers(
	profilesByPubkey: Record<string, Profile>,
	contentPubkeys: string[]
): Record<string, NostrUser> | undefined {
	const users = contentPubkeys.map((pubkey) => {
		const profile = profilesByPubkey[pubkey];
		const displayName = profile?.displayName;
		const name = profile?.name;
		return { pubkey, displayName, name };
	});

	return users.length > 0
		? users.reduce((result, user) => {
				return { ...result, [user.pubkey]: user };
			}, {})
		: undefined;
}
