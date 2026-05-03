import { createRxNostr } from 'rx-nostr';
import { verifier } from '@rx-nostr/crypto';

export const rxNostr = createRxNostr({
    verifier
});

let initialized = false;

export function initNostr(relays: string[]) {
    if (initialized) return;

    rxNostr.setDefaultRelays(relays);
    initialized = true;
}