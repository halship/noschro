import DOMPurify from "isomorphic-dompurify";
import { decodeNostrURI } from "nostr-tools/nip19";
import { nostrState } from "./state.svelte";
import { emitProfile } from "./subscription";

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
                result.push('<a href="');
                result.push(url);
                result.push('" target="_blank" class="underline">');
                result.push('[Open media (type: ' + imgType + ')]');
                result.push('</a>');

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

            if (code.startsWith('nevent') || code.startsWith('note')) {
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
                        }
                    } else {
                        emitProfile({
                            kinds: [0],
                            authors: [decoded.data],
                            limit: 1,
                        });

                        result.push(decoded.data.slice(9));
                    }

                    result.push('</a>');
                }
            } else {
                result.push(codeResult[0]);
            }

            i += codeResult[0].length;
        } else if (emojiResult) {
            const emojiCode = emojiResult[0].slice(1, -1);

            if (emojiCode in emojis) {
                result.push('<img src="');
                result.push(emojis[emojiCode]);
                result.push('" class="inline-block max-w-4">');
            } else {
                result.push(emojiResult[0]);
            }

            i += emojiResult[0].length;
        } else {
            // その他の場合
            result.push(content.slice(i).charAt(0));
            i++;
        }
    }

    return result.join('');
}
