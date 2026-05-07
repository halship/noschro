import type { NostrEvent } from '$lib/nostr_type';
import { toPost, type Post } from './post';
import type { Profile } from './profile';
import type { Quote } from './quote';
import type { NostrUser } from './user';

export type TimelineItem = {
	id: string;
	post: Post;
	profile?: Profile;
	replyToEvent?: {
		id: string;
		post?: Post;
		profile?: Profile;
	};
	replyToUsers: NostrUser[];
	quotes?: Record<string, Quote>;
};

export function toTimelineItem(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	id: string
): TimelineItem | undefined {
	if (!(id in eventsById)) return undefined;

	const event = eventsById[id];
	const post = toPost(event);
	const profile = profilesByPubkey[post.pubkey];
	const replyToEvent = event.replyToId
		? getReplyToEvent(eventsById, profilesByPubkey, event.replyToId)
		: undefined;
	const replyToUsers = event.replyToPubkeys.map((pubkey) => {
		if (pubkey in profilesByPubkey) {
			const profile = profilesByPubkey[pubkey];
			return { pubkey, name: profile.name, displayName: profile.displayName };
		} else {
			return { pubkey };
		}
	});
	const quotes =
		event.quotedIds.length > 0
			? getQuotes(eventsById, profilesByPubkey, event.quotedIds)
			: undefined;

	return {
		id,
		post,
		profile,
		replyToEvent,
		replyToUsers,
		quotes
	};
}

function getReplyToEvent(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	replyToId: string
): {
	id: string;
	post?: Post;
	profile?: Profile;
} {
	if (!(replyToId in eventsById)) {
		return { id: replyToId };
	}

	const replyToPost = toPost(eventsById[replyToId]);
	const replyToProfile = profilesByPubkey[replyToPost.pubkey];

	return {
		id: replyToId,
		post: replyToPost,
		profile: replyToProfile
	};
}

function getQuotes(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	quotedIds: string[]
): Record<string, Quote> {
	return quotedIds
		.filter((id) => id in eventsById)
		.map((id) => {
			const event = eventsById[id];
			const post = toPost(event);
			const profile = profilesByPubkey[post.pubkey];
			const quotes = getQuotes(eventsById, profilesByPubkey, event.quotedIds);
			return { post, profile, quotes };
		})
		.reduce((result, quote) => {
			return { ...result, [quote.post.id]: quote };
		}, {});
}
