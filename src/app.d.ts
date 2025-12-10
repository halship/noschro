// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Event as NostrEvent, UnsignedEvent } from "nostr-tools/pure";

type NostrAPI = {
	/** returns a public key as hex */
	getPublicKey(): Promise<string>;
	/** takes an event object, adds `id`, `pubkey` and `sig` and returns it */
	signEvent(event: UnsignedEvent): Promise<NostrEvent>;

	// Optional

	/** returns a basic map of relay urls to relay policies */
	getRelays(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;

	/** NIP-04: Encrypted Direct Messages */
	nip04?: {
		/** returns ciphertext and iv as specified in nip-04 */
		encrypt(pubkey: string, plaintext: string): Promise<string>;
		/** takes ciphertext and iv as specified in nip-04 */
		decrypt(pubkey: string, ciphertext: string): Promise<string>;
	};

	nip44: {
		encrypt(peer: string, plaintext: string): Promise<string>;

		decrypt(peer: string, ciphertext: string): Promise<string>;
	};
};

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		nostr?: NostrAPI;
	}
}

export { };
