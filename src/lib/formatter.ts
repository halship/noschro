import { Emoji, Image, Video, Link, Reference, Text, User, Space, type Token, LongContent, Br, Tab } from './types/token';
import { decodeNostrURI } from 'nostr-tools/nip19';

export function tokenize(content: string): Token[] {
    const result: Token[] = [];
    let i: number = 0
    let text: string = '';

    while (i < content.length) {
        const urlResult = content.slice(i).match(/^https?:\/\/([\w!?/+\-=_~:;.,*&@#$%()'[\]]+)/);
        const codeResult = content.slice(i).match(/^nostr:[a-z0-9]+/);
        const emojiResult = content.slice(i).match(/^:[a-zA-Z0-9_]+:/);

        if (urlResult) {
            result.push(new Text(text));
            text = '';

            // URL文字列の場合
            const url: string = urlResult[0];
            const imgResult = url.match(/^.+\.(jpg|jpeg|gif|png|webp)/i);
            const videoResult = url.match(/^.+\.mp4/i);

            if (imgResult) {
                // 画像の場合
                result.push(new Image(url));
            } else if (videoResult) {
                // 動画の場合
                result.push(new Video(url));
            } else {
                // 外部リンクの場合
                result.push(new Link(url));
            }
            i += url.length;
        } else if (content.slice(i).startsWith('\n')) {
            // 改行の場合
            result.push(new Text(text));
            text = '';

            result.push(new Br());
            i++;
        } else if (codeResult) {
            // Nostrのコードの場合
            result.push(new Text(text));
            text = '';

            const code = codeResult[0].slice(6);
            const decoded = decodeNostrURI(code);
            if (decoded.type === 'nevent') {
                // ノートの引用の場合
                result.push(new Reference(code, decoded.data.id));
            } else if (decoded.type === 'note') {
                result.push(new Reference(code, decoded.data));
            } else if (decoded.type === 'naddr') {
                result.push(new LongContent(code));
            } else if (decoded.type === 'npub') {
                // ユーザの参照の場合
                result.push(new User(code, decoded.data));
            } else if (decoded.type === 'nprofile') {
                result.push(new User(code, decoded.data.pubkey));
            } else {
                result.push(new Text(codeResult[0]));
            }

            i += codeResult[0].length;
        } else if (emojiResult) {
            // 絵文字の場合
            result.push(new Text(text));
            text = '';

            result.push(new Emoji(emojiResult[0].slice(1, -1)));
            i += emojiResult[0].length;
        } else if (content.slice(i).startsWith(' ')) {
            result.push(new Text(text));
            text = '';

            result.push(new Space('half'));
            i++;
        } else if (content.slice(i).startsWith('　')) {
            result.push(new Text(text));
            text = '';

            result.push(new Space('full'));
            i++;
        } else if (content.slice(i).startsWith('\t')) {
            result.push(new Text(text));
            text = '';

            result.push(new Tab());
            i++;
        } else {
            // その他の場合
            text += content.slice(i).charAt(0);
            i++;
        }
    }

    if (text.length > 0) {
        result.push(new Text(text));
    }

    return result;
}
