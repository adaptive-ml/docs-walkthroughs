<script lang="ts">
  /**
   * Navigation arrows for walkthroughs.
   * Must be placed inside a positioned container (the viewer).
   * Dots are rendered separately by WalkthroughDots component.
   */

  let {
    currentStep = 0,
    totalSteps = 0,
    isDark = false,
    onPrev,
    onNext,
  }: {
    currentStep: number;
    totalSteps: number;
    isDark?: boolean;
    onPrev: () => void;
    onNext: () => void;
  } = $props();

  const canGoPrev = $derived(currentStep > 0);
  const canGoNext = $derived(currentStep < totalSteps - 1);
</script>

<!-- Side navigation arrows (absolutely positioned within viewer) -->
<button
  class="nav-arrow nav-prev"
  class:visible={canGoPrev}
  class:dark={isDark}
  onclick={onPrev}
  disabled={!canGoPrev}
  aria-label="Previous step"
>
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M11 13L7 9L11 5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</button>

<button
  class="nav-arrow nav-next"
  class:visible={canGoNext}
  class:dark={isDark}
  onclick={onNext}
  disabled={!canGoNext}
  aria-label="Next step"
>
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M7 5L11 9L7 13"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</button>

<style>
  .nav-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    opacity: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }

  .nav-arrow.visible {
    opacity: 1;
  }

  .nav-arrow:hover {
    background: #fff;
    transform: translateY(-50%) scale(1.06);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  }

  .nav-arrow:active {
    transform: translateY(-50%) scale(0.96);
  }

  .nav-prev {
    left: 14px;
  }

  .nav-next {
    right: 14px;
  }

  .nav-arrow.dark {
    background: rgba(40, 40, 40, 0.95);
    color: #eee;
  }

  .nav-arrow.dark:hover {
    background: #333;
  }
</style>
