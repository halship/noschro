import type { NostrEvent } from '$lib/nostr_type';
import { toPost, type Post } from './post';
import type { Profile } from './profile';

export type TimelineItem = {
	id: string;
	post: Post;
	profile?: Profile;
	replyTo?: {
		id: string;
		post?: Post;
		profile?: Profile;
	};
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

	if (event.replyToId) {
		if (event.replyToId in eventsById) {
			const replyToPost = toPost(eventsById[event.replyToId]);
			const replyToProfile = profilesByPubkey[replyToPost.pubkey];

			return {
				id,
				post,
				profile,
				replyTo: {
					id: event.replyToId,
					post: replyToPost,
					profile: replyToProfile
				}
			};
		} else {
			return {
				id,
				post,
				profile,
				replyTo: {
					id: event.replyToId
				}
			};
		}
	} else {
		return { id, post, profile };
	}
}
