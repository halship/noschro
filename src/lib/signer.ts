import { browser } from "$app/environment";
import { seckeySigner, type EventSigner } from "@rx-nostr/crypto";
import { nip07Signer } from "rx-nostr";
import { nostrState } from "./state.svelte";

export let signer: EventSigner | null = null;
export let pubkey: string | null = null;

export async function tryLogin(): Promise<boolean> {
    const savedLogin = browser ? localStorage.getItem('login') : null;
    if (savedLogin === null) {
        nostrState.isAuthoricated = false;
        return false;
    }

    if (savedLogin.startsWith('nsec')) {
        signer = seckeySigner(savedLogin);
        pubkey = await signer.getPublicKey();
        nostrState.isAuthoricated = true;
        return true;
    } else if (savedLogin === '<NIP-7>') {
        signer = nip07Signer();
        pubkey = await signer.getPublicKey();
        nostrState.isAuthoricated = true;
        return true;
    }

    return false;
}

export function logout() {
    if (browser) {
        localStorage.removeItem('login');
    }

    nostrState.isAuthoricated = false;
    signer = null;
    pubkey = null;
}