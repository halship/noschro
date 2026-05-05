import type { NostrEvent } from '$lib/nostr_type';
import type * as Nostr from 'nostr-typedef';

export type Profile = {
	id: string;
	pubkey: string;
	updatedAt: number;
	name?: string;
	displayName?: string;
	picture?: string;
	banner?: string;
	about?: string;
	tags: string[][];
};

export function toProfile(event: NostrEvent): Profile | null {
	if (event.kind !== 0) return null;

	let metadata: Nostr.Content.Metadata;

	try {
		metadata = JSON.parse(event.content) as Nostr.Content.Metadata;
	} catch {
		return null;
	}

	return {
		id: event.id,
		pubkey: event.pubkey,
		updatedAt: event.created_at,
		name: metadata.name,
		displayName: metadata.display_name,
		picture: metadata.picture,
		banner: metadata.banner,
		about: metadata.about,
		tags: event.tags
	};
}
