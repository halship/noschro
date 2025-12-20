import type { SettingType } from "./types/nostr";
import { browser } from "$app/environment";

export function getRefIds(tags: string[][]): string[] {
    return tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]);
}

export function getRefPubkeys(tags: string[][]): string[] {
    const result = new Set(tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]));
    return [...result];
}

export function getEmojis(tags: string[][]): Record<string, string> {
    return tags
        .filter((tag) => tag[0] === 'emoji')
        .reduce((result, tag) => {
            return { ...result, [tag[1]]: tag[2] };
        }, {});
}

export function getSetting(key: SettingType): string | null {
    if (browser) {
        return localStorage.getItem(key);
    }
    return null;
}

export function setSetting(key: SettingType, value: string) {
    if (browser) {
        localStorage.setItem(key, value);
    }
}

export function getAddr(kind: number, pubkey: string, identifier: string): string {
    return `${kind}:${pubkey}:${identifier}`;
}