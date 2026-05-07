import type { NostrEvent } from '$lib/nostr_type';
import { parseContent, type NostrToken } from './token';

export type Post = {
	id: string;
	pubkey: string;
	createdAt: number;
	tags: string[][];
	content: string;
	contentTokens: NostrToken[];
};

export function toPost(event: NostrEvent): Post {
	return {
		id: event.id,
		pubkey: event.pubkey,
		createdAt: event.created_at,
		tags: event.tags,
		content: event.content,
		contentTokens: parseContent(event.content, event.tags)
	};
}
