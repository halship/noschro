<script lang="ts">
	import { Satellite } from '@lucide/svelte';
	import FormatedText from './FormatedText.svelte';
	import type { UserGeneralStatus } from '$lib/types/nostr';
	import { getEmojis } from '$lib/util';

	let { user_status }: { user_status: UserGeneralStatus } = $props();
	let emojis = $derived(getEmojis(user_status.tags));
	let url = $derived(
		user_status.tags
			.filter((tag) => tag[0] === 'r')
			.map((tag) => tag[1])
			.at(0)
	);
</script>

<div class="user-status text-xs text-thin">
	<Satellite class="inline-block size-[1.2em]" />
	<span class="align-bottom">
		{#if url}
			<a href={url} class="underline"><FormatedText text={user_status.content} {emojis} /></a>
		{:else}
			<FormatedText text={user_status.content} {emojis} />
		{/if}
	</span>
</div>
