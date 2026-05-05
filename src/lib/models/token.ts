const URL_RE = /https?:\/\/[a-zA-Z0-9?&#./=\-_~%:@+]+/g;
const IMAGE_EXT_RE = /\.(png|jpe?g|git|webp|avif)(\?.*)?$/;
const EMOJI_RE = /:([a-zA-Z0-9_\\+\\-]+):/g;

export type NostrToken =
	| { type: 'text'; text: string }
	| { type: 'link'; url: string }
	| { type: 'image'; url: string }
	| { type: 'emoji'; shortcode: string; url: string };

export function parseContent(content: string, tags: string[][]): NostrToken[] {
	const emojiMap = getEmojiMap(tags);

	let tokens = parseUrlContent(content);
	tokens = parseEmojiTokens(tokens, emojiMap);

	return tokens;
}

export function parseUrlContent(content: string): NostrToken[] {
	const tokens: NostrToken[] = [];
	let lastIndex = 0;

	for (const match of content.matchAll(URL_RE)) {
		const url = match[0];
		const index = match.index ?? 0;

		if (index > lastIndex) {
			tokens.push({
				type: 'text',
				text: content.slice(lastIndex, index)
			});
		}

		if (IMAGE_EXT_RE.test(url)) {
			tokens.push({
				type: 'image',
				url: url
			});
		} else {
			tokens.push({
				type: 'link',
				url: url
			});
		}

		lastIndex = index + url.length;
	}

	if (lastIndex < content.length) {
		tokens.push({
			type: 'text',
			text: content.slice(lastIndex)
		});
	}

	return mergeTextTokens(tokens);
}

function parseEmojiTokens(tokens: NostrToken[], emojiMap: Map<string, string>): NostrToken[] {
	const result: NostrToken[] = [];

	for (const token of tokens) {
		if (token.type !== 'text') {
			result.push(token);
			continue;
		}

		let lastIndex = 0;

		for (const match of token.text.matchAll(EMOJI_RE)) {
			const shortcode = match[1];
			const url = emojiMap.get(shortcode);
			const index = match.index ?? 0;

			if (!url) continue;

			if (index > lastIndex) {
				result.push({
					type: 'text',
					text: token.text.slice(lastIndex, index)
				});
			}

			result.push({
				type: 'emoji',
				shortcode,
				url
			});

			lastIndex = index + match[0].length;
		}

		if (lastIndex < token.text.length) {
			result.push({
				type: 'text',
				text: token.text.slice(lastIndex)
			});
		}
	}

	return mergeTextTokens(result);
}

function mergeTextTokens(tokens: NostrToken[]): NostrToken[] {
	const result: NostrToken[] = [];

	for (const token of tokens) {
		const last = result.at(-1);

		if (token.type === 'text' && last?.type === 'text') {
			last.text += token.text;
		} else {
			result.push(token);
		}
	}

	return result;
}

function getEmojiMap(tags: string[][]): Map<string, string> {
	const result = new Map<string, string>();

	for (const tag of tags) {
		if (tag[0] !== 'emoji') continue;

		const shortcode = tag[1];
		const url = tag[2];

		if (!shortcode || !url) continue;

		result.set(shortcode, url);
	}

	return result;
}
