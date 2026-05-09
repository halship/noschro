import { createRxNostr, nip07Signer, type EventSigner, type RxNostr } from 'rx-nostr';
import { verifier } from '@rx-nostr/crypto';
import { getSetting } from './settings';
import { GLOBAL_RELAYS, TEMP_RELAYS } from './constants';
import { fetchRelayList } from './subscriptions/relay_list';
import type { NostrRelay } from './nostr_type';
import { fetchFollowList } from './subscriptions/follow_list';

export type Client = {
	rxNostr: RxNostr;
	relays: NostrRelay[];
	signer?: EventSigner;
	pubkey?: string;
	followees?: string[];
};

let client: Client | null = null;

export async function initNostr(): Promise<Client> {
	if (client !== null) return client;

	if (getSetting('login') === '<NIP-07>') {
		return await signin();
	}

	return signout();
}

export async function signin(): Promise<Client> {
	const signer = nip07Signer();
	const pubkey = await signer.getPublicKey();
	const rxNostr = createRxNostr({
		verifier,
		signer
	});
	rxNostr.setDefaultRelays([...TEMP_RELAYS]);

	const relays = await fetchRelayList(rxNostr, pubkey);
	const followees = await fetchFollowList(rxNostr, pubkey);

	client = {
		rxNostr,
		signer,
		pubkey,
		relays,
		followees
	};

	return client;
}

export function signout(): Client {
	const rxNostr = createRxNostr({
		verifier
	});
	rxNostr.setDefaultRelays([...GLOBAL_RELAYS]);
	const relays = [...GLOBAL_RELAYS];

	client = { rxNostr, relays };

	return client;
}
