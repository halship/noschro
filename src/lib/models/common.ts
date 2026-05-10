import type { NostrEvent } from '$lib/nostr_type';
import type { Profile } from './profile';
import { toPostItem, type PostItem } from './timeline';
import type { NostrUser } from './user';

export function getQuotes(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	quotedIds: string[]
): Record<string, PostItem> | undefined {
	const quotes: PostItem[] = quotedIds
		.map((id) => toPostItem(eventsById, profilesByPubkey, id))
		.filter((item) => item !== undefined);

	return quotes.length > 0
		? quotes.reduce((result, quote) => {
				return { ...result, [quote.id]: quote };
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
