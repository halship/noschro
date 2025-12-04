<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>ノスクロ -noschro-</title>
</svelte:head>

<div id="main">
	<h1>ノスクロ</h1>
	{@render children()}
</div>
