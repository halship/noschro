import type { NostrEvent } from '$lib/nostr_type';
import { getContentUsers, getQuotes } from './common';
import { toPost, type Post } from './post';
import { type Profile } from './profile';
import type { NostrUser } from './user';

export type PostItem = {
	kind: 'post';
	id: string;
	post: Post;
	profile?: Profile;
	replyToItem?: {
		id: string;
		item?: PostItem;
	};
	replyToUsers: NostrUser[];
	quotes?: Record<string, PostItem>;
	contentUsers?: Record<string, NostrUser>;
	createdAt: number;
};

export type RepostItem = {
	kind: 'repost';
	id: string;
	pubkey: string;
	profile?: Profile;
	repostTo: {
		id: string;
		item?: PostItem;
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
	const replyToItem = event.replyToId
		? getReplyToItem(eventsById, profilesByPubkey, event.replyToId)
		: undefined;
	const replyToUsers: NostrUser[] = event.replyToPubkeys.map((pubkey) => {
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
		replyToItem,
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

	return {
		kind: 'repost',
		id: event.id,
		pubkey: event.pubkey,
		profile,
		repostTo: {
			id: repostToId,
			item: toPostItem(eventsById, profilesByPubkey, repostToId)
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

function getReplyToItem(
	eventsById: Record<string, NostrEvent>,
	profilesByPubkey: Record<string, Profile>,
	replyToId: string
): {
	id: string;
	item?: PostItem;
} {
	if (!(replyToId in eventsById)) {
		return { id: replyToId };
	}

	return {
		id: replyToId,
		item: toPostItem(eventsById, profilesByPubkey, replyToId)
	};
}
