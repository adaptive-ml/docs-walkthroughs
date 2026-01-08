<script lang="ts">
  import { onMount } from 'svelte';

  let { x = 0, y = 0, visible = true }: { x: number; y: number; visible: boolean } = $props();

  // Animation state
  let currentX = $state(0);
  let currentY = $state(0);
  let animationId: number | null = null;
  let startTime: number | null = null;
  let fromX = 0;
  let fromY = 0;
  let toX = 0;
  let toY = 0;
  let wasVisible = false;

  const DURATION = 350; // ms - snappy but smooth

  // Expo-out easing: very sharp deceleration, snappy feel
  function expoOut(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animate(timestamp: number) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const eased = expoOut(progress);

    currentX = fromX + (toX - fromX) * eased;
    currentY = fromY + (toY - fromY) * eased;

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      animationId = null;
      startTime = null;
    }
  }

  function startAnimation(newX: number, newY: number) {
    // Cancel any existing animation
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }

    // Start from current position (smooth interruption)
    fromX = currentX;
    fromY = currentY;
    toX = newX;
    toY = newY;
    startTime = null;
    animationId = requestAnimationFrame(animate);
  }

  function jumpTo(newX: number, newY: number) {
    // Cancel any animation and jump directly
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
      startTime = null;
    }
    currentX = newX;
    currentY = newY;
    fromX = newX;
    fromY = newY;
    toX = newX;
    toY = newY;
  }

  $effect(() => {
    if (visible && !wasVisible) {
      // Just became visible: appear at destination instantly
      jumpTo(x, y);
    } else if (visible && wasVisible) {
      // Already visible: animate to new position
      startAnimation(x, y);
    }
    // Update visibility tracking
    wasVisible = visible;
  });

  onMount(() => {
    // Initialize at destination
    jumpTo(x, y);
    wasVisible = visible;

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  });
</script>

{#if visible}
  <div class="cursor-container" style="left: {currentX}%; top: {currentY}%;">
    <!-- Pulse ring -->
    <div class="pulse-ring"></div>
    <div class="pulse-ring pulse-ring-delayed"></div>

    <!-- Cursor -->
    <svg
      class="cursor"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 4L10.5 20L12.5 13.5L19 11.5L4 4Z"
        fill="white"
        stroke="#1a1a1a"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
  </div>
{/if}

<style>
  .cursor-container {
    position: absolute;
    pointer-events: none;
    z-index: 10;
    transform: translate(-2px, -2px);
  }

  .cursor {
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25));
  }

  .pulse-ring {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(59, 130, 246, 0.9);
    border-radius: 50%;
    box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.4);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    z-index: 1;
  }

  .pulse-ring-delayed {
    animation-delay: 1s;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(2.5);
      opacity: 0;
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }
</style>
