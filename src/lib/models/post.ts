import type { NostrEvent } from '$lib/nostr_type';
import { getReplyToIds } from '$lib/state.svelte';

export type Post = {
	id: string;
	pubkey: string;
	createdAt: number;
	tags: string[][];
	content: string;
	replyToIds: string[];
};

export function toPost(event: NostrEvent): Post {
	let replyToIds: string[] = [];
	if (event.replyToId) {
		replyToIds = getReplyToIds(event.replyToId);
	} else if (event.rootId) {
		replyToIds = [event.rootId];
	}

	return {
		id: event.id,
		pubkey: event.pubkey,
		createdAt: event.created_at,
		tags: event.tags,
		content: event.content,
		replyToIds
	};
}
