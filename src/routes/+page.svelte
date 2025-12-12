<script lang="ts">
	import { maxTimelineNum } from '$lib/consts';
	import Post from '$lib/components/Post.svelte';
	import { nostrState } from '$lib/state.svelte';
	import { MoveUp } from '@lucide/svelte';
	import { emitTimeline, subscribe } from '$lib/timelines/base_timeline';
	import { onMount } from 'svelte';
	import { tryLogin } from '$lib/signer';
	import { goto } from '$app/navigation';

	let isScrolled: boolean = $state(false);

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		subscribe();
		emitTimeline();
	});

	function handleScroll() {
		isScrolled = window.scrollY > 0;
	}

	function handleScrollUp() {
		window.scroll({
			top: 0,
			behavior: 'instant'
		});
	}

	function handleLoadMore() {}
</script>

<svelte:window onscroll={handleScroll} />

<h1 class="text-lg font-bold">Home</h1>

{#if nostrState.events.length === 0}
	<p class="text-center">loading...</p>
{:else}
	<div id="posts">
		{#each nostrState.events as ev (ev.id)}
			<Post event={ev} eventsById={nostrState.eventsById} profiles={nostrState.profiles} />
		{/each}
	</div>

	{#if nostrState.events.length < maxTimelineNum}
		<button
			id="load-more-btn"
			class="block my-3 mx-auto p-2 text-center bg-light dark:bg-dark border-dark dark:border-light border rounded-md"
			onclick={handleLoadMore}
		>
			▼ Load more ▼
		</button>
	{/if}
{/if}

<button
	id="scroll-up-btn"
	class={[
		!isScrolled && 'hidden',
		'bg-light',
		'dark:bg-dark',
		'border-dark',
		'dark:border-light',
		'border',
		'p-2',
		'fixed',
		'bottom-5',
		'right-5'
	]}
	onclick={handleScrollUp}
>
	<MoveUp />
</button>
