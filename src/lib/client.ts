import { createRxNostr, nip07Signer, type RxNostr } from 'rx-nostr';
import { verifier } from '@rx-nostr/crypto';
import { getSetting } from './settings';
import { appState } from './state.svelte';
import { GLOBAL_RELAY } from './constants';

export let rxNostr: RxNostr | null = null;

export function initNostr(): RxNostr {
	if (rxNostr !== null) return rxNostr;

	if (getSetting('login') === '<NIP-07>') {
		rxNostr = signin();
		return rxNostr;
	}

	rxNostr = signout();
	return rxNostr;
}

export function signin(): RxNostr {
	const rxNostr = createRxNostr({
		verifier,
		signer: nip07Signer()
	});
	appState.isSigned = true;

	return rxNostr;
}

export function signout(): RxNostr {
	const rxNostr = createRxNostr({
		verifier
	});
	rxNostr.setDefaultRelays([...GLOBAL_RELAY]);
	appState.isSigned = false;

	return rxNostr;
}
