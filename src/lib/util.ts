import DOMPurify from "isomorphic-dompurify";
import type { NostrEvent, SettingType } from "./types/nostr";
import { configLoadImage } from "./consts";
import { browser } from "$app/environment";

export function formatDisplayName(displayName: string, tags: string[][]): string {
    let emojis: Record<string, string> = {};
    tags.filter((tag) => tag[0] === 'emoji')
        .forEach((tag) => {
            emojis = { ...emojis, [tag[1]]: tag[2] };
        });

    displayName = DOMPurify.sanitize(displayName);

    const result: string[] = [];
    const loadImage = getSetting('load-image') === 'true';
    let i: number = 0

    while (i < displayName.length) {
        const emojiResult = displayName.slice(i).match(/^:[a-zA-Z0-9_]+:/);

        if (emojiResult) {
            if (loadImage) {
                if (loadImage) {
                    const emojiCode = emojiResult[0].slice(1, -1);

                    if (emojiCode in emojis) {
                        result.push('<img src="');
                        result.push(emojis[emojiCode]);
                        result.push('" class="inline-block max-w-[1em]">');
                    } else {
                        result.push(emojiResult[0]);
                    }
                } else {
                    result.push(emojiResult[0]);
                }
            } else {
                result.push(emojiResult[0]);
            }

            i += emojiResult[0].length;
        } else if (displayName.slice(i).startsWith(' ')) {
            result.push('&nbsp;');
            i++;
        } else {
            // その他の場合
            result.push(displayName.slice(i).charAt(0));
            i++;
        }
    }

    return result.join('');
}

export function formatReaction(content: string, tags: string[][]): string {
    if (getSetting('load-image') === 'false') {
        return content;
    }

    let emojis: Record<string, string> = {};
    tags.filter((tag) => tag[0] === 'emoji')
        .forEach((tag) => {
            emojis = { ...emojis, [tag[1]]: tag[2] };
        });

    content = DOMPurify.sanitize(content);
    const emojiResult = content.match(/^:[a-zA-Z0-9_]+:$/);

    if (emojiResult) {
        return `<img src="${emojis[content.slice(1, -1)]}" class="inline-block max-w-[1em]">`;
    }

    return content;
}

export function getRefIds(tags: string[][]): string[] {
    return tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]);
}

export function getRefPubkeys(tags: string[][]): string[] {
    const result = new Set(tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]));
    return [...result];
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