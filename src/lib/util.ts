import DOMPurify from "isomorphic-dompurify";
import { decodeNostrURI, naddrEncode } from "nostr-tools/nip19";
import { nostrState } from "./state.svelte";
import type { NostrEvent } from "./types/nostr";
import { rxReqProfiles } from "./timelines/base_timeline";
import { configLoadImage, kindMetaData } from "./consts";
import { browser } from "$app/environment";

export function formatContent(content: string, tags: string[][]): string {
    let emojis: Record<string, string> = {};
    tags.filter((tag) => tag[0] === 'emoji')
        .forEach((tag) => {
            emojis = { ...emojis, [tag[1]]: tag[2] };
        });

    content = DOMPurify.sanitize(content);

    const result: string[] = [];
    let i: number = 0

    while (i < content.length) {
        const urlResult = content.slice(i).match(/^https?:\/\/([\w!?/+\-=_~;.,*&@#$%()'[\]]+)/);
        const codeResult = content.slice(i).match(/^nostr:[a-z0-9]+/);
        const emojiResult = content.slice(i).match(/^:[a-zA-Z0-9_]+:/);

        if (urlResult) {
            // URL文字列の場合
            const url: string = urlResult[0];
            const urlBase: string = urlResult[1];
            const imgResult = url.match(/^.+\.(jpg|jpeg|gif|png|webp|mp4)/i);

            if (imgResult) {
                const imgType = imgResult[1].toLowerCase();
                // 画像の場合
                if (getLoadImage()) {
                    result.push(`<a href="${url}" target="_blank"><img src="${url}" class="block object-contain max-h-80 max-w-full my-3 rounded-md mx-auto border border-thin"></a>`);
                } else {
                    result.push(`<a href="${url}" target="_blank" class="underline">[Open media (type: ${imgType})]</a>`);
                }

                i += url.length;
            } else {
                // 外部リンクの場合
                result.push('<a href="');
                result.push(url);
                result.push('" target="_blank" class="underline">');

                if (urlBase.length > 100) {
                    result.push(urlBase.slice(0, 100 - 3));
                    result.push('...');
                } else {
                    result.push(urlBase);
                }

                result.push('</a>');

                i += url.length;
            }
        } else if (content.slice(i).startsWith('\n')) {
            // 改行の場合
            result.push('<br>');
            i++;
        } else if (codeResult) {
            const code = codeResult[0].slice(6);

            if (code.startsWith('nevent') || code.startsWith('note') || code.startsWith('naddr')) {
                result.push('<a href="/');
                result.push(code);
                result.push('" class="underline">[引用]</a>');
            } else if (code.startsWith('npub')) {
                const decoded = decodeNostrURI(code);
                if (decoded.type === 'npub') {
                    result.push('<a href="/');
                    result.push(code);
                    result.push('">@');

                    if (decoded.data in nostrState.profiles) {
                        if (nostrState.profiles[decoded.data]?.name) {
                            result.push(nostrState.profiles[decoded.data]?.name!);
                        } else if (nostrState.profiles[decoded.data]?.display_name) {
                            result.push(nostrState.profiles[decoded.data]?.display_name!);
                        } else {
                            result.push(code.slice(0, 9));
                        }
                    } else {
                        rxReqProfiles.emit({
                            kinds: [kindMetaData],
                            authors: [decoded.data],
                            limit: 1,
                        });
                        result.push(code.slice(0, 9));
                    }

                    result.push('</a>');
                }
            } else {
                result.push(codeResult[0]);
            }

            i += codeResult[0].length;
        } else if (emojiResult) {
            if (getLoadImage()) {
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

            i += emojiResult[0].length;
        } else if (content.slice(i).startsWith(' ')) {
            result.push('&nbsp;');
            i++;
        } else {
            // その他の場合
            result.push(content.slice(i).charAt(0));
            i++;
        }
    }

    return result.join('');
}

export function formatDisplayName(displayName: string, tags: string[][]): string {
    let emojis: Record<string, string> = {};
    tags.filter((tag) => tag[0] === 'emoji')
        .forEach((tag) => {
            emojis = { ...emojis, [tag[1]]: tag[2] };
        });

    displayName = DOMPurify.sanitize(displayName);

    const result: string[] = [];
    let i: number = 0

    while (i < displayName.length) {
        const emojiResult = displayName.slice(i).match(/^:[a-zA-Z0-9_]+:/);

        if (emojiResult) {
            if (getLoadImage()) {
                if (getLoadImage()) {
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
    if (!getLoadImage()) {
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

export function getRefIds(ev: NostrEvent): string[] {
    return ev.tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]);
}

export function getRefPubkeys(ev: NostrEvent): string[] {
    const result = new Set(ev.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]));
    return [...result];
}

export function getNaddr(ev: NostrEvent): string {
    return naddrEncode({
        identifier: ev.id,
        pubkey: ev.pubkey,
        kind: ev.kind,
    });
}

export function tagFilter(tagName: string): (tag: string[]) => boolean {
    return (tag: string[]) => {
        if (tag.length > 0) return tag[0] === tagName;
        return false;
    };
}

export function getLoadImage(): boolean {
    return browser ? localStorage.getItem(configLoadImage) === 'true' : false;;
}