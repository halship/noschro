import type { NostrEvent } from '$lib/nostr_type';

export type Post = {
	id: string;
	pubkey: string;
	createdAt: number;
	tags: string[][];
	content: string;
};

export function toPost(event: NostrEvent): Post {
	return {
		id: event.id,
		pubkey: event.pubkey,
		createdAt: event.created_at,
		tags: event.tags,
		content: event.content
	};
}
