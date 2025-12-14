<script lang="ts">
	import { goto } from '$app/navigation';
	import { kindPost } from '$lib/consts';
	import { tryLogin } from '$lib/signer';
	import { rxNostr, subscribe } from '$lib/timelines/base_timeline';
	import { onMount } from 'svelte';

	let content = $state('');

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
	<textarea
		rows="3"
		bind:value={content}
		onkeydown={handleKeyPost}
		class="block w-full h-100 border border-thin rounded-md"
	></textarea>

	<button
		onclick={handlePost}
		class="inline-block mt-3 border-dark dark:border-light rounded-md border p-2">投稿</button
	>
</div>
