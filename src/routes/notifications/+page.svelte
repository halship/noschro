<script lang="ts">
	import NotifyMentions from '$lib/NotifyMentions.svelte';
	import { nostrState } from '$lib/state.svelte';
	import type { NotifyType } from '$lib/types/nostr';
	import { AtSign, Bell, Repeat2 } from '@lucide/svelte';

	let notifyType: NotifyType = 'all';

	let allButtonProps = { class: ['p-2', 'selected-btn'] };
	let mentionsButtonProps = { class: ['p-2'] };
	let repostsButtonProps = { class: ['p-2'] };

	function handleNotifyButton(ntype: NotifyType) {
		notifyType = ntype;

		if (ntype === 'all') {
			if (!allButtonProps.class.includes('selected-btn')) {
				allButtonProps.class = [...allButtonProps.class, 'selected-btn'];
			}
			mentionsButtonProps.class = mentionsButtonProps.class.filter((cls) => cls !== 'selected-btn');
			repostsButtonProps.class = repostsButtonProps.class.filter((cls) => cls !== 'selected-btn');
		} else if (ntype === 'mentions') {
			if (!mentionsButtonProps.class.includes('selected-btn')) {
				mentionsButtonProps.class = [...mentionsButtonProps.class, 'selected-btn'];
			}
			allButtonProps.class = allButtonProps.class.filter((cls) => cls !== 'selected-btn');
			repostsButtonProps.class = repostsButtonProps.class.filter((cls) => cls !== 'selected-btn');
		} else if (ntype === 'reposts') {
			if (!repostsButtonProps.class.includes('selected-btn')) {
				repostsButtonProps.class = [...repostsButtonProps.class, 'selected-btn'];
			}
			mentionsButtonProps.class = mentionsButtonProps.class.filter((cls) => cls !== 'selected-btn');
			allButtonProps.class = allButtonProps.class.filter((cls) => cls !== 'selected-btn');
		}
	}
</script>

<h1 class="text-lg font-bold">通知</h1>

<ul class="flex justify-center items-center border rounded-md max-w-fit">
	<li>
		<button id="notify-all-btn" {...allButtonProps} onclick={() => handleNotifyButton('all')}
			><Bell /></button
		>
	</li>

	<li>
		<button
			id="notify-mention-btn"
			{...mentionsButtonProps}
			onclick={() => handleNotifyButton('mentions')}><AtSign /></button
		>
	</li>

	<li>
		<button
			id="notify-reposts-btn"
			{...repostsButtonProps}
			onclick={() => handleNotifyButton('reposts')}><Repeat2 /></button
		>
	</li>
</ul>

{#if notifyType === 'mentions'}
	<NotifyMentions mentions={nostrState.mentions} profiles={nostrState.profiles} />
{/if}

<style>
	.selected-btn {
		border-bottom: 4px solid;
	}
</style>
