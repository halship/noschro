<script lang="ts">
	import Notifications from '$lib/Notifications.svelte';
	import { nostrState } from '$lib/state.svelte';
	import type { NotifyType } from '$lib/types/nostr';
	import { AtSign, Bell, Repeat2, Heart } from '@lucide/svelte';

	let notifyType: NotifyType = 'all';

	function handleNotifyButton(ntype: NotifyType) {
		notifyType = ntype;
	}
</script>

<h1 class="text-lg font-bold">通知</h1>

<ul class="flex justify-center items-center border rounded-md max-w-fit">
	<li>
		<button
			id="notify-all-btn"
			class={['p-2', notifyType === 'all' && 'selected-btn']}
			onclick={() => handleNotifyButton('all')}><Bell /></button
		>
	</li>

	<li>
		<button
			id="notify-mention-btn"
			class={['p-2', notifyType === 'mentions' && 'selected-btn']}
			onclick={() => handleNotifyButton('mentions')}><AtSign /></button
		>
	</li>

	<li>
		<button
			id="notify-reposts-btn"
			class={['p-2', notifyType === 'reposts' && 'selected-btn']}
			onclick={() => handleNotifyButton('reposts')}><Repeat2 /></button
		>
	</li>

	<li>
		<button
			id="notify-reactions-btn"
			class={['p-2', notifyType === 'reactions' && 'selected-btn']}
			onclick={() => handleNotifyButton('reactions')}><Heart /></button
		>
	</li>
</ul>

{#if notifyType === 'all'}
	<Notifications events={nostrState.notifications} profiles={nostrState.profiles} />
{:else if notifyType === 'mentions'}
	<Notifications
		events={nostrState.notifications.filter((ev) => ev.kind === 1)}
		profiles={nostrState.profiles}
	/>
{:else if notifyType === 'reposts'}
	<Notifications
		events={nostrState.notifications.filter((ev) => ev.kind === 6 || ev.kind === 16)}
		profiles={nostrState.profiles}
	/>
{:else if notifyType === 'reactions'}
	<Notifications
		events={nostrState.notifications.filter((ev) => ev.kind === 7)}
		profiles={nostrState.profiles}
	/>
{/if}

<style>
	.selected-btn {
		border-bottom: 4px solid;
	}
</style>
