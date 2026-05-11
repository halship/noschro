import { decodeNostrURI } from 'nostr-tools/nip19';

export const NOSTR_URI_RE: RegExp = /nostr:([a-z0-9]+)/g;

type DecodedNostrURI = ReturnType<typeof decodeNostrURI>;

export function safeDecodeNostrURI(uri: string): DecodedNostrURI | undefined {
	try {
		return decodeNostrURI(uri);
	} catch {
		return undefined;
	}
}

export function extractDecodedNostrURIs(content: string): DecodedNostrURI[] {
	return content
		.matchAll(NOSTR_URI_RE)
		.map((match) => safeDecodeNostrURI(match[1]))
		.filter((code) => code !== undefined)
		.toArray();
}

export function extractQuoteIds(content: string): string[] {
	return extractDecodedNostrURIs(content)
		.filter((code) => code.type === 'nevent' || code.type === 'note')
		.map((code) => {
			if (code.type === 'nevent') {
				return code.data.id;
			} else {
				return code.data;
			}
		});
}

export function extractContentPubkeys(content: string): string[] {
	return extractDecodedNostrURIs(content)
		.filter((code) => code.type === 'npub')
		.map((code) => code.data);
}
