<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PostContent from '$lib/components/PostContent.svelte';
	import { kindPost } from '$lib/consts';
	import { tokenize } from '$lib/formatter';
	import { pubkey, tryLogin } from '$lib/signer';
	import { nostrState } from '$lib/state.svelte';
	import { rxNostr, subscribe } from '$lib/timelines/base_timeline';
	import { Reference, User, type Token } from '$lib/types/token';
	import { onMount } from 'svelte';

	let content: string = $state(
		page.url.searchParams.get('quote') ? `nostr:${page.url.searchParams.get('quote')}` : ''
	);
	let tokens: Token[] = $derived(tokenize(content));

	const quotes = $derived(
		tokens
			.filter((token) => token instanceof Reference)
			.map((token) => token.id)
			.map((id) => ['q', id, nostrState.relays[0].url, pubkey!])
	);

	const pubkeys = $derived(
		tokens
			.filter((token) => token instanceof User)
			.map((token) => token.pubkey)
			.map((pub) => ['p', pub])
	);

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();
	});

	function handlePost() {
		const tags: string[][] = [...quotes, ...pubkeys];

		rxNostr?.send({
			kind: kindPost,
			content: content,
			tags
		});
		content = '';
		goto('/');
	}

	function handleKeyPost(event: KeyboardEvent) {
		if (event.ctrlKey && event.key === 'Enter') {
			handlePost();
		}
	}
</script>

<h1 class="text-lg font-bold">投稿</h1>

<div class="border border-thin rounded-md p-2 mt-2">
	<h2>=プレビュー</h2>
	<div class="border border-thin rounded-md p-2 h-40 overflow-auto">
		<PostContent {content} tags={[]} />
	</div>

	<h2 class="mt-5">= 入力</h2>
	<textarea
		bind:value={content}
		onkeydown={handleKeyPost}
		class="block w-full h-20 border border-thin rounded-md resize-none p-1"
	></textarea>

	<button
		onclick={handlePost}
		class="inline-block mt-3 border-dark dark:border-light rounded-md border p-2">投稿</button
	>
</div>
