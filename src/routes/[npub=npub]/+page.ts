import { decodeNostrURI } from 'nostr-tools/nip19';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const decodedCode = decodeNostrURI(params.npub);

	if (decodedCode.type === 'npub') {
		return {
			pubkey: decodedCode.data
		};
	} else {
		error(404, 'Not found');
	}
};
