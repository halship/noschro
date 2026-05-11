import type { NostrEvent } from '$lib/nostr_type';
import type * as Nostr from 'nostr-typedef';
import { parseName, type NostrToken } from './token';
import { appState } from '$lib/state.svelte';
import { extractContentPubkeys, extractQuoteIds } from './nostr-uri';

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
	quoteIds: string[];
	contentPubkeys: string[];
	nameTokens?: NostrToken[];
};

export function toProfile(event: NostrEvent): Profile | null {
	if (event.kind !== 0) return null;

	let metadata: Nostr.Content.Metadata;

	try {
		metadata = JSON.parse(event.content) as Nostr.Content.Metadata;
	} catch {
		return null;
	}

	const quoteIds = metadata.about
		? extractQuoteIds(metadata.about).filter((id) => !(id in appState.eventsById))
		: [];

	const contentPubkeys = metadata.about
		? extractContentPubkeys(metadata.about).filter(
				(pubkey) => !(pubkey in appState.profilesByPubkey)
			)
		: [];

	const nameTokens = metadata.display_name
		? parseName(metadata.display_name, event.tags)
		: undefined;

	return {
		id: event.id,
		pubkey: event.pubkey,
		updatedAt: event.created_at,
		name: metadata.name,
		displayName: metadata.display_name,
		picture: metadata.picture,
		banner: metadata.banner,
		about: metadata.about,
		tags: event.tags,
		quoteIds,
		contentPubkeys,
		nameTokens
	};
}
