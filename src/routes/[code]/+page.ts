import { getAddr } from "$lib/util.js";
import { error } from "@sveltejs/kit";
import { decodeNostrURI, type DecodedResult } from "nostr-tools/nip19";

export function load({ params }) {
    const decoded = decodeNostrURI(params.code);

    if (!decoded.data) error(404, 'Not found');

    const result = decoded as DecodedResult;

    if (result.type === 'nevent') {
        return {
            codeType: result.type,
            id: result.data.id,
        };
    } else if (result.type === 'note') {
        return {
            codeType: result.type,
            id: result.data,
        };
    } else if (result.type === 'naddr') {
        return {
            codeType: result.type,
            addr: getAddr(result.data.kind, result.data.pubkey, result.data.identifier),
            kind: result.data.kind,
            pubkey: result.data.pubkey,
            identifier: result.data.identifier,
        };
    } else if (result.type === 'npub') {
        return {
            codeType: result.type,
            pubkey: result.data,
        };
    } else if (result.type === 'nprofile') {
        return {
            codeType: result.type,
            pubkey: result.data.pubkey,
        };
    }

    return {};
};