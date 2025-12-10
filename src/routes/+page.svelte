<script lang="ts">
	import { maxTimeline } from '$lib/consts';
	import Post from '$lib/Post.svelte';
	import { nostrState } from '$lib/state.svelte';
	import { emitOlderTimeline } from '$lib/subscription';
	import { MoveUp } from '@lucide/svelte';

	function scrollUp() {
		window.scroll({
			top: 0,
			behavior: 'instant'
		});
	}

	function switchScrollUpButton() {
		const element = document.getElementById('scroll-up-btn');
		element?.classList.toggle('hidden', window.scrollY <= 0);
	}

	function loadMore() {
		emitOlderTimeline();
	}
</script>

<svelte:window onscroll={switchScrollUpButton} />

<h1 class="text-lg font-bold">Home</h1>

{#if nostrState.events.length === 0}
	<p class="text-center">loading...</p>
{:else}
	<div id="posts">
		{#each nostrState.events as ev (ev.id)}
			<Post event={ev} eventsById={nostrState.eventsById} profiles={nostrState.profiles} />
		{/each}
	</div>

	{#if nostrState.events.length < maxTimeline}
		<button
			id="load-more-btn"
			class="block my-3 mx-auto p-2 text-center bg-light dark:bg-dark border-dark dark:border-light border rounded-md"
			onclick={loadMore}
		>
			▼ Load more ▼
		</button>
	{/if}
{/if}

<button
	id="scroll-up-btn"
	class="hidden bg-light dark:bg-dark border-dark dark:border-light border p-2 fixed bottom-5 right-5"
	onclick={scrollUp}
>
	<MoveUp />
</button>
