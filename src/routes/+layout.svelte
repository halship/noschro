<script lang="ts">
	import './layout.css';
	import { Bell, House, Moon, Settings, SquarePen, Sun } from '@lucide/svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>noschro</title>
	<link rel="shortcut icon" href="/favicon.svg" />
</svelte:head>

<div id="main" class="">
	{@render children()}
</div>
