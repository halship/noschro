<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PostContent from '$lib/components/PostContent.svelte';
	import { kindPost } from '$lib/consts';
	import { tryLogin } from '$lib/signer';
	import { rxNostr, subscribe } from '$lib/timelines/base_timeline';
	import { onMount } from 'svelte';

	let quote: string | null = page.url.searchParams.get('quote');
	let content = $state(quote ? `nostr:${quote}` : '');

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();
	});

	function handlePost() {
		rxNostr?.send({
			kind: kindPost,
			content: content
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

	<hr class="my-5" />

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
