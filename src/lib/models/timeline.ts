import type { NostrEvent } from '$lib/nostr_type';
import { toPost, type Post } from './post';
import type { Profile } from './profile';

export type NostrUser = {
	pubkey: string;
	name?: string;
	displayName?: string;
};

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
	const replyToUsers = event.replyToPubkeys.map((pubkey) => {
		if (pubkey in profilesByPubkey) {
			const profile = profilesByPubkey[pubkey];
			return { pubkey, name: profile.name, displayName: profile.displayName };
		} else {
			return { pubkey };
		}
	});

	if (event.replyToId) {
		if (event.replyToId in eventsById) {
			const replyToPost = toPost(eventsById[event.replyToId]);
			const replyToProfile = profilesByPubkey[replyToPost.pubkey];

			return {
				id,
				post,
				profile,
				replyToEvent: {
					id: event.replyToId,
					post: replyToPost,
					profile: replyToProfile
				},
				replyToUsers
			};
		} else {
			return {
				id,
				post,
				profile,
				replyToEvent: {
					id: event.replyToId
				},
				replyToUsers
			};
		}
	} else {
		return { id, post, profile, replyToUsers };
	}
}
