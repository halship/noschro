import { decodeNostrURI } from 'nostr-tools/nip19';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const decodedResult = decodeNostrURI(params.ncode);

	if (decodedResult.type !== 'npub') {
		error(404, 'Not Found');
	}

	return decodedResult;
};
