<script lang="ts">
	import { Music, Satellite } from '@lucide/svelte';
	import FormatedText from './FormatedText.svelte';
	import type { UserStatus } from '$lib/types/nostr';
	import { getEmojis } from '$lib/util';

	let { user_status }: { user_status: UserStatus } = $props();

	let emojis = $derived(getEmojis(user_status.tags));

	let url = $derived(
		user_status.tags
			.filter((tag) => tag[0] === 'r')
			.map((tag) => tag[1])
			.at(0)
	);

	let kind = $derived(
		user_status.tags
			.filter((tag) => tag[0] === 'd')
			.map((tag) => tag[1])
			.at(0)
	);
</script>

<div class="user-status text-xs text-thin">
	{#if kind === 'general'}
		<Satellite class="inline-block size-[1.2em]" />
	{:else}
		<Music class="inline-block size-[1.2em]" />
	{/if}

	<span class="align-bottom">
		{#if url}
			<a href={url} class="underline"><FormatedText text={user_status.content} {emojis} /></a>
		{:else}
			<FormatedText text={user_status.content} {emojis} />
		{/if}
	</span>
</div>
