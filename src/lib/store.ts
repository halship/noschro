import type { EventSigner } from "rx-nostr";
import { writable, type Writable } from "svelte/store";

export const loginType: Writable<'nsec'> = writable();
export const pubkey = writable('');
export const signer: Writable<EventSigner> = writable();
