import type { NostrEvent } from '$lib/nostr_type';
import { getContentUsers, getQuotes } from './common';
import { toPost, type Post } from './post';
import { type Profile } from './profile';
import type { Quote } from './quote';
import type { NostrUser } from './user';

export type PostItem = {
	kind: 'post';
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
	createdAt: number;
};

export type RepostItem = {
	kind: 'repost';
	id: string;
	profile?: Profile;
	repostTo: {
		id: string;
		post?: Post;
		profile?: Profile;
	};
	createdAt: number;
};

export type TimelineItem = PostItem | RepostItem;

export function toPostItem(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	id: string
): PostItem | undefined {
	const event = eventsById[id];
	if (!event) return undefined;

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
		kind: 'post',
		id: event.id,
		post,
		profile,
		replyToEvent,
		replyToUsers,
		quotes,
		contentUsers,
		createdAt: event.created_at
	};
}

export function toRepostItem(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	id: string
): RepostItem | undefined {
	const event = eventsById[id];
	if (!event) return undefined;

	const profile = profilesByPubkey[event.pubkey];
	const repostToId = event.tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1])[0];
	const repostToEvent = eventsById[repostToId];
	const repostToPost = repostToEvent ? toPost(repostToEvent) : undefined;
	const repostToProfile = repostToEvent ? profilesByPubkey[repostToEvent.pubkey] : undefined;

	return {
		kind: 'repost',
		id: event.id,
		profile,
		repostTo: {
			id: repostToId,
			post: repostToPost,
			profile: repostToProfile
		},
		createdAt: event.created_at
	};
}

export function toTimelineItem(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	id: string
): TimelineItem | undefined {
	if (!(id in eventsById)) return undefined;

	const event = eventsById[id];

	if (event.kind === 1) {
		return toPostItem(eventsById, profilesByPubkey, id);
	} else if (event.kind === 6) {
		return toRepostItem(eventsById, profilesByPubkey, id);
	}

	return undefined;
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
