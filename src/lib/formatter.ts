export function formatTimestamp(timestamp: number): string {
	const dt = new Date(timestamp * 1000);
	const minutes = dt.getMinutes();
	const formatedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();

	return `${dt.getHours()}:${formatedMinutes}`;
}

export function formatPubkey(pubkey: string): string {
	return pubkey.substring(0, 9);
}

export function pubkeyToColor(pubkey: string): string {
	let hash = 0;
	for (let i = 0; i < pubkey.length; i++) {
		hash = pubkey.charCodeAt(i) + ((hash << 5) - hash);
	}

	const hue = hash % 360;
	return `hsl(${hue}, 40%, 50%)`;
}

export function formatLink(url: string): string {
	if (url.startsWith('https://')) {
		return url.substring(8);
	} else if (url.startsWith('http://')) {
		return url.substring(7);
	} else {
		return url;
	}
}
