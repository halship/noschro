<script lang="ts">
	import { goto } from '$app/navigation';
	import Post from '$lib/components/Post.svelte';
	import { tryLogin } from '$lib/signer';
	import { nostrState } from '$lib/state.svelte';
	import { rxReqOldNotifications, subscribe } from '$lib/timelines/base_timeline';
	import { getNotificationsFilter } from '$lib/timelines/home_timeline';
	import type { NotifyType } from '$lib/types/nostr';
	import { AtSign, Bell, Repeat2, Heart } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';

	let notifyType: NotifyType = $state('all');

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();
		nostrState.notifications = [];
		nostrState.notificationsById = {};
		rxReqOldNotifications.emit(getNotificationsFilter(notifyType));
	});

	onDestroy(() => {
		nostrState.notifications = [];
		nostrState.notificationsById = {};
	});

	function handleNotifyButton(ntype: NotifyType) {
		notifyType = ntype;
		nostrState.notifications = [];
		nostrState.notificationsById = {};
		rxReqOldNotifications.emit(getNotificationsFilter(notifyType));
	}
</script>

<h1 class="text-lg font-bold">通知</h1>

<ul class="flex justify-center items-center border rounded-md max-w-fit">
	<li>
		<button
			id="notify-all-btn"
			class="p-2"
			class:selected-btn={notifyType === 'all'}
			onclick={() => handleNotifyButton('all')}><Bell /></button
		>
	</li>

	<li>
		<button
			id="notify-mention-btn"
			class="p-2"
			class:selected-btn={notifyType === 'mentions'}
			onclick={() => handleNotifyButton('mentions')}><AtSign /></button
		>
	</li>

	<li>
		<button
			id="notify-reposts-btn"
			class="p-2"
			class:selected-btn={notifyType === 'reposts'}
			onclick={() => handleNotifyButton('reposts')}><Repeat2 /></button
		>
	</li>

	<li>
		<button
			id="notify-reactions-btn"
			class="p-2"
			class:selected-btn={notifyType === 'reactions'}
			onclick={() => handleNotifyButton('reactions')}><Heart /></button
		>
	</li>
</ul>

<div id="notifications">
	{#each nostrState.notifications as ev (ev.id)}
		<Post state={nostrState} event={ev} />
	{/each}
</div>

<style>
	.selected-btn {
		border-bottom: 4px solid;
	}
</style>
