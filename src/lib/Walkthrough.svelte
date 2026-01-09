<script lang="ts">
  import { onMount } from 'svelte';
  import type { WalkthroughData } from './types';
  import { loadWalkthrough, getImageUrl, prefetchAdjacentSteps, clearPrefetchCache } from './data/loader';
  import WalkthroughImage from './WalkthroughImage.svelte';
  import WalkthroughCursor from './WalkthroughCursor.svelte';
  import WalkthroughNav from './components/WalkthroughNav.svelte';

  let { walkthroughName = 'create-usecase', theme = 'light' }: { walkthroughName: string; theme?: string } = $props();
  const isDark = $derived(theme === 'dark');
  const baseUrl = import.meta.env.BASE_URL;

  // State
  let data = $state<WalkthroughData | null>(null);
  let currentStep = $state(0);
  let error = $state<string | null>(null);
  let firstImageLoaded = $state(false);
  let parentDescriptions = $state<Record<number, string> | null>(null);

  // Ready when both data and first image are loaded
  const isReady = $derived(data !== null && firstImageLoaded);

  // Derived values
  const step = $derived(data?.steps[currentStep] ?? null);
  const imageSrc = $derived(
    step ? getImageUrl(step, walkthroughName, baseUrl, isDark) : ''
  );
  const cursorX = $derived(step?.cursor ? step.cursor.x * 100 : 0);
  const cursorY = $derived(step?.cursor ? step.cursor.y * 100 : 0);
  const displayDescription = $derived(
    parentDescriptions?.[currentStep] ?? step?.description ?? ''
  );
  const hasHtmlDescription = $derived(parentDescriptions?.[currentStep] !== undefined);

  // Prefetch adjacent steps when step or theme changes
  $effect(() => {
    if (data) {
      prefetchAdjacentSteps(data, currentStep, walkthroughName, baseUrl, isDark);
    }
  });

  // Clear prefetch cache when theme changes (need different images)
  $effect(() => {
    // Track isDark to trigger on theme change
    isDark;
    clearPrefetchCache();
  });

  onMount(() => {
    // Parse descriptions from URL params (e.g., ?descriptions={"0":"Click..."})
    const urlParams = new URLSearchParams(window.location.search);
    const descriptionsParam = urlParams.get('descriptions');
    if (descriptionsParam) {
      try {
        parentDescriptions = JSON.parse(decodeURIComponent(descriptionsParam));
      } catch (e) {
        console.error('Failed to parse descriptions param:', e);
      }
    }

    // Load walkthrough metadata then preload first image
    loadWalkthrough(walkthroughName, { baseUrl })
      .then((json) => {
        data = json;
        // Preload first image before showing UI
        const firstStep = json.steps[0];
        if (firstStep) {
          const firstImageUrl = getImageUrl(firstStep, walkthroughName, baseUrl, isDark);
          const img = new Image();
          img.onload = () => {
            firstImageLoaded = true;
            // Prefetch adjacent steps after first image loads
            prefetchAdjacentSteps(json, 0, walkthroughName, baseUrl, isDark);
          };
          img.onerror = () => {
            // Still show UI even if image fails to load
            firstImageLoaded = true;
          };
          img.src = firstImageUrl;
        } else {
          firstImageLoaded = true;
        }
      })
      .catch((e) => {
        error = e instanceof Error ? e.message : 'Unknown error';
      });

    // Keyboard navigation
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeydown);

    // Listen for descriptions from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'walkthrough-descriptions') {
        if (event.data.walkthroughName === walkthroughName) {
          parentDescriptions = event.data.descriptions;
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('message', handleMessage);
    };
  });

  function prev() {
    if (currentStep > 0) currentStep--;
  }

  function next() {
    if (data && currentStep < data.steps.length - 1) currentStep++;
  }

  function goToStep(index: number) {
    currentStep = index;
  }

  function handleDescriptionClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'a') {
      event.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        // Get parent origin - try ancestorOrigins first (works cross-origin), fall back to referrer
        let parentOrigin = '';
        try {
          if (location.ancestorOrigins?.length > 0) {
            parentOrigin = location.ancestorOrigins[0];
          } else if (document.referrer) {
            parentOrigin = new URL(document.referrer).origin;
          }
        } catch (e) {
          // Ignore URL parsing errors
        }

        // Navigate the top window with full URL
        const fullUrl = parentOrigin ? new URL(href, parentOrigin).href : href;
        window.top?.location.assign(fullUrl);
      }
    }
  }
</script>

<div class="walkthrough" class:dark={isDark} role="region" aria-label="Interactive walkthrough">
  {#if error}
    <div class="error">{error}</div>
  {:else if !isReady}
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  {:else}
    <!-- Header bar -->
    <div class="header">
      <span class="step-badge">{currentStep + 1} of {data.steps.length}</span>
      {#if hasHtmlDescription}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <p class="description" onclick={handleDescriptionClick}>
          {@html displayDescription}
        </p>
      {:else}
        <p class="description">{displayDescription}</p>
      {/if}
    </div>

    <!-- Image viewer -->
    <div class="viewer" style="aspect-ratio: {data.viewport.width} / {data.viewport.height};">
      <WalkthroughImage src={imageSrc} alt={step?.description ?? ''} />
      <WalkthroughCursor x={cursorX} y={cursorY} visible={step?.cursor !== null} />
      <WalkthroughNav
        {currentStep}
        totalSteps={data.steps.length}
        {isDark}
        onPrev={prev}
        onNext={next}
      />
    </div>

    <!-- Footer with dot navigation (outside viewer to appear below) -->
    <div class="footer">
      <div class="dots">
        {#each data.steps as _, i}
          <button
            class="dot"
            class:active={i === currentStep}
            onclick={() => goToStep(i)}
            aria-label="Step {i + 1}"
          ></button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .walkthrough {
    --bg: #fff;
    --bg-header: #fff;
    --border: #e5e7eb;
    --text: #374151;
    --text-muted: #6b7280;
    --badge-bg: #f3f4f6;

    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  .walkthrough.dark {
    --bg: rgb(11, 12, 16);
    --bg-header: rgb(11, 12, 16);
    --border: rgba(255, 255, 255, 0.1);
    --text: #e5e5e5;
    --text-muted: #9ca3af;
    --badge-bg: rgba(255, 255, 255, 0.08);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
  }

  .step-badge {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--badge-bg);
    padding: 5px 11px;
    border-radius: 12px;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }

  .description {
    margin: 0;
    font-size: 14px;
    color: var(--text);
    line-height: 1.45;
  }

  .description :global(a) {
    color: #275AF1;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 2px;
    transition: text-decoration-color 0.15s ease;
  }

  .description :global(a:hover) {
    text-decoration-color: currentColor;
  }

  .walkthrough.dark .description :global(a) {
    color: #80a0fe;
  }

  .viewer {
    position: relative;
    width: 100%;
    background: #111;
  }

  .footer {
    padding: 16px 18px;
    background: var(--bg);
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: #d1d5db;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
  }

  .dot:hover {
    background: #9ca3af;
  }

  .dot.active {
    background: #374151;
    transform: scale(1.25);
  }

  .walkthrough.dark .dot {
    background: rgba(255, 255, 255, 0.2);
  }

  .walkthrough.dark .dot:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  .walkthrough.dark .dot.active {
    background: #e5e5e5;
  }

  .error {
    padding: 32px;
    color: #dc2626;
    text-align: center;
    font-size: 14px;
  }

  .loading {
    padding: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top-color: var(--text-muted);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
