import type { RxNostr } from 'rx-nostr';
import { createRxNostr, nip07Signer } from 'rx-nostr';
import { getSetting } from './settings';
import type { EventSigner } from '@rx-nostr/crypto';
import { verifier } from '@rx-nostr/crypto';

export type Client = {
	signer: EventSigner;
	rxNostr: RxNostr;
	pubkey: string;
};

export let client: Client | null = null;

export async function login(): Promise<boolean> {
	const loginKind = getSetting('login');
	if (loginKind === null) return false;

	if (loginKind === '<NIP-07>') {
		try {
			const signer = nip07Signer();
			const pubkey = await signer.getPublicKey();
			const rxNostr = createRxNostr({
				verifier,
				signer
			});

			client = { signer, rxNostr, pubkey };
			return true;
		} catch {
			return false;
		}
	}

	return false;
}
