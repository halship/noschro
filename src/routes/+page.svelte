<script lang="ts">
	import { maxTimelineNum, loadLimit } from '$lib/consts';
	import Post from '$lib/components/Post.svelte';
	import { nostrState } from '$lib/state.svelte';
	import { MoveUp } from '@lucide/svelte';
	import {
		getFollowees,
		getRelays,
		rxNostr,
		rxReqOldTimeline,
		rxReqTimeline,
		subscribe
	} from '$lib/timelines/base_timeline';
	import { onMount } from 'svelte';
	import { tryLogin } from '$lib/signer';
	import { goto } from '$app/navigation';
	import { getHomeOldTimelineFilter, getHomeTimelineFilter } from '$lib/timelines/home_timeline';

	let isScrolled: boolean = $state(false);

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();

		nostrState.timelineNum = loadLimit;

		if (nostrState.events.length === 0) {
			rxReqOldTimeline.emit(getHomeOldTimelineFilter());
			rxReqTimeline.emit(getHomeTimelineFilter());
		}
	});

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	function handleScrollUp() {
		window.scroll({
			top: 0,
			behavior: 'instant'
		});
		nostrState.timelineNum = loadLimit;
		nostrState.events = nostrState.events.slice(0, nostrState.timelineNum);
	}

	function handleLoadMore() {
		rxReqOldTimeline.emit(getHomeOldTimelineFilter());
	}
</script>

<svelte:window onscroll={handleScroll} />

<h1 class="text-lg font-bold">ホーム</h1>

{#if nostrState.events.length === 0}
	<p class="text-center">loading...</p>
{:else}
	<div id="posts">
		{#each nostrState.events as ev (ev.id)}
			<Post event={ev} />
		{/each}
	</div>

	{#if nostrState.events.length < maxTimelineNum}
		<button
			id="load-more-btn"
			class="block my-3 mx-auto p-2 text-center bg-light dark:bg-dark border-dark dark:border-light border rounded-md"
			class:hidden={nostrState.events.length >= maxTimelineNum}
			onclick={handleLoadMore}
		>
			▼ Load more ▼
		</button>
	{/if}
{/if}

<button
	id="scroll-up-btn"
	class="bg-light dark:bg-dark border-dark dark:border-light border p-2 fixed bottom-5 right-5"
	class:hidden={!isScrolled}
	onclick={handleScrollUp}
>
	<MoveUp />
</button>
