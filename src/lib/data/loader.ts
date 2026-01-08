/**
 * Data loading utilities for walkthroughs.
 *
 * Uses predictive prefetching: loads current image immediately,
 * then prefetches adjacent steps in the background.
 */

import type { WalkthroughData, WalkthroughStep } from '../types';

export interface LoadOptions {
  baseUrl: string;
}

/**
 * Load walkthrough metadata from JSON file.
 * Does NOT preload images - use prefetch functions for that.
 */
export async function loadWalkthrough(
  name: string,
  options: LoadOptions
): Promise<WalkthroughData> {
  const url = `${options.baseUrl}walkthroughs/${name}/walkthrough.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load walkthrough "${name}": ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the appropriate image URL for a step based on theme.
 */
export function getImageUrl(
  step: WalkthroughStep,
  walkthroughName: string,
  baseUrl: string,
  isDark: boolean
): string {
  const folder = step.folder || walkthroughName;
  const imageFile = isDark && step.imageDark ? step.imageDark : step.image;
  return `${baseUrl}walkthroughs/${folder}/${imageFile}`;
}

// Cache of prefetched image URLs to avoid duplicate requests
const prefetchedUrls = new Set<string>();

/**
 * Prefetch a single image URL (no-op if already prefetched).
 */
export function prefetchImage(url: string): Promise<void> {
  if (prefetchedUrls.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      prefetchedUrls.add(url);
      resolve();
    };
    img.onerror = () => resolve(); // Don't fail on prefetch errors
    img.src = url;
  });
}

/**
 * Prefetch images for adjacent steps (current + next few).
 * Call this after navigation to keep the buffer filled.
 */
export function prefetchAdjacentSteps(
  data: WalkthroughData,
  currentStep: number,
  walkthroughName: string,
  baseUrl: string,
  isDark: boolean,
  lookahead: number = 2
): void {
  const steps = data.steps;

  // Prefetch current and next N steps
  for (let i = currentStep; i <= Math.min(currentStep + lookahead, steps.length - 1); i++) {
    const url = getImageUrl(steps[i], walkthroughName, baseUrl, isDark);
    prefetchImage(url);
  }

  // Also prefetch previous step for back navigation
  if (currentStep > 0) {
    const url = getImageUrl(steps[currentStep - 1], walkthroughName, baseUrl, isDark);
    prefetchImage(url);
  }
}

/**
 * Clear the prefetch cache (useful for theme changes).
 */
export function clearPrefetchCache(): void {
  prefetchedUrls.clear();
}
