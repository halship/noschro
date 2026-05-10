import type { NostrEvent } from '$lib/nostr_type';
import type * as Nostr from 'nostr-typedef';
import { NOSTR_URI_RE, parseName, type NostrToken } from './token';
import { decodeNostrURI } from 'nostr-tools/nip19';
import { appState } from '$lib/state.svelte';

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

	const decodedCodes = metadata.about
		? metadata.about
				.matchAll(NOSTR_URI_RE)
				.map((match) => decodeNostrURI(match[1]))
				.toArray()
		: [];

	const quoteIds = decodedCodes
		.filter((code) => code.type === 'nevent' || code.type === 'note')
		.map((code) => {
			if (code.type === 'nevent') {
				return code.data.id;
			} else {
				return code.data;
			}
		})
		.filter((id) => !(id in appState.eventsById));

	const contentPubkeys = decodedCodes
		.filter((code) => code.type === 'npub')
		.map((code) => code.data)
		.filter((pubkey) => !(pubkey in appState.profilesByPubkey));

	const nameTokens = metadata.display_name ? parseName(metadata.display_name, event.tags) : undefined;

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
