export type ContentToken = { type: 'text'; text: string };

export function parseContent(content: string): ContentToken[] {
	const tokens: ContentToken[] = [];

	tokens.push({ type: 'text', text: content });

	return tokens;
}
