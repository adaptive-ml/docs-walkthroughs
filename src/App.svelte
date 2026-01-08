<script lang="ts">
  import { onMount } from 'svelte';
  import Walkthrough from './lib/Walkthrough.svelte';
  import { createThemeStore } from './lib/stores/theme.svelte';

  // Get walkthrough name from URL query
  const params = new URLSearchParams(window.location.search);
  const walkthroughName = params.get('walkthrough') || 'create-usecase';

  // Theme detection using store (no polling)
  const themeStore = createThemeStore();

  onMount(() => {
    // Start observing theme changes
    const cleanup = themeStore.observe();
    return cleanup;
  });

  // Apply theme class to document
  $effect(() => {
    document.documentElement.classList.toggle('dark', themeStore.isDark);
  });
</script>

<main class:dark={themeStore.isDark}>
  <Walkthrough {walkthroughName} theme={themeStore.theme} />
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    background: transparent;
  }

  main {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    box-sizing: border-box;
    background: transparent;
  }
</style>
