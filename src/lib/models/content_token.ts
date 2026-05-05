const URL_RE = /https?:\/\/[a-zA-Z0-9?&#./=\-_~%:@+]+/g;
const IMAGE_EXT_RE = /\.(png|jpe?g|git|webp|avif)(\?.*)?$/;

export type ContentToken =
	| { type: 'text'; text: string }
	| { type: 'link'; url: string }
	| { type: 'image'; url: string };

export function parseContent(content: string): ContentToken[] {
	const tokens = parseUrlContent(content);

	return tokens;
}

export function parseUrlContent(content: string): ContentToken[] {
	const tokens: ContentToken[] = [];
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

function mergeTextTokens(tokens: ContentToken[]): ContentToken[] {
	const result: ContentToken[] = [];

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
