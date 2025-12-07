import type { RxNostr, RxReq } from "rx-nostr";
import { createRxForwardReq, createRxNostr } from 'rx-nostr';
import { verifier } from "@rx-nostr/crypto";
import type { Subscription } from "rxjs";

const defaultRelays = ['wss://yabu.me'];
let client: NostrClient | null = null;

export type NostrClient = {
    rx_nostr: RxNostr,
};

export type NostrEvent = {
    id: string;
    pubkey: string;
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
};

export type NostrProfile = {
    pubkey: string;
    name?: string,
    display_name?: string,
    picture?: string;
    about?: string;
};

export type NostrRef = {
    id: string;
    pubkey: string;
}

export function getNostrClient(): NostrClient {
    if (!client) {
        const rxNostr = createRxNostr({ verifier });
        rxNostr.setDefaultRelays(defaultRelays);

        client = {
            rx_nostr: rxNostr,
        };
    }

    return client;
}

export function disposeNostrClient() {
    client = null;
}