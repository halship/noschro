import { browser } from "$app/environment";
import { subscribe } from "$lib/timelines/base_timeline";
import { seckeySigner } from "@rx-nostr/crypto";
import type { LayoutLoad } from "./$types";
import { nip07Signer } from "rx-nostr";

export const load: LayoutLoad = async () => {
    const savedLogin = browser ? localStorage.getItem('login') : null;
    if (savedLogin === null) {
        return {
            authoricated: false,
        };
    }

    if (savedLogin.startsWith('nsec')) {
        const signer = seckeySigner(savedLogin);
        const pubkey = await signer.getPublicKey();
        return {
            authoricated: true,
            signer,
            pubkey,
        };
    } else if (savedLogin === '<NIP-7>') {
        const signer = nip07Signer();
        const pubkey = await signer.getPublicKey();
        return {
            authoricated: true,
            signer,
            pubkey,
        };
    }

    return {
        authoricated: false,
    };
};