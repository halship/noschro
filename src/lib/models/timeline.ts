import type { NostrEvent } from '$lib/nostr_type';
import { getContentUsers, getQuotes } from './common';
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
	contentUsers?: Record<string, NostrUser>;
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
	const quotes = getQuotes(eventsById, profilesByPubkey, event.quotedIds);
	const contentUsers = getContentUsers(profilesByPubkey, event.contentPubkeys);

	return {
		id,
		post,
		profile,
		replyToEvent,
		replyToUsers,
		quotes,
		contentUsers
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
