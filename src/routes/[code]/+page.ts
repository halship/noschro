import { error } from "@sveltejs/kit";
import { decodeNostrURI, type DecodedResult } from "nostr-tools/nip19";

export function load({ params }) {
    const decoded = decodeNostrURI(params.code);

    if (!decoded.data) error(404, 'Not found');

    const result = decoded as DecodedResult;

    return { result: result };
};