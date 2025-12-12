import type { Nip07 } from "nostr-typedef"
import type { PageLoad } from "../[code]/$types";
import { browser } from "$app/environment";

declare const window: {
    nostr: Nip07.Nostr | undefined;
};

export const load: PageLoad = () => {
    return {
        hasNip07: browser ? window.nostr !== undefined : false,
    };
};