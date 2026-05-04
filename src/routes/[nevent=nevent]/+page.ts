import { decodeNostrURI } from 'nostr-tools/nip19';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const decodedCode = decodeNostrURI(params.nevent);

	if (decodedCode.type === 'nevent') {
		return {
			id: decodedCode.data.id
		};
	} else {
		error(404, 'Not found');
	}
};
