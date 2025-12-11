<script lang="ts">
    import { Sun, Moon } from '@lucide/svelte';
    import { browser } from '$app/environment';
	import { onMount } from 'svelte';

    let theme = $state('light');

    onMount(() => {
        if (browser) {
            theme = localStorage.getItem('theme') ?? 'light';
            document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
        }
    });

    function toggleTheme() {
        if (browser) {
            if (theme === 'light') {
                theme = 'dark';
            } else {
                theme = 'light';
            }

            localStorage.setItem('theme', theme);
            document.documentElement.classList.toggle('dark');
        }
    }
</script>

<button class="border border-thin rounded-full p-1" onclick={toggleTheme}>
    {#if theme === 'light'}
        <Sun />
    {:else}
        <Moon />
    {/if}
</button>
