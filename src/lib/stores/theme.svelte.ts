/**
 * Theme detection store using Svelte 5 runes.
 *
 * Detects theme from (in priority order):
 * 1. Explicit URL parameter (?theme=dark)
 * 2. Parent document class (for iframe embeds like Mintlify)
 * 3. System preference (prefers-color-scheme)
 *
 * Uses MutationObserver instead of polling for better performance.
 */

export type Theme = 'light' | 'dark';
export type ThemeSource = 'explicit' | 'parent' | 'system';

interface ThemeState {
  theme: Theme;
  source: ThemeSource;
}

/**
 * Create a reactive theme store.
 *
 * Returns an object with:
 * - theme: current theme ('light' | 'dark')
 * - source: where the theme was detected from
 * - observe(): start observing theme changes, returns cleanup function
 */
export function createThemeStore() {
  let theme = $state<Theme>('light');
  let source = $state<ThemeSource>('system');

  // Check URL parameter first (highest priority)
  function checkExplicitTheme(): boolean {
    const params = new URLSearchParams(window.location.search);
    const paramTheme = params.get('theme');
    if (paramTheme === 'light' || paramTheme === 'dark') {
      theme = paramTheme;
      source = 'explicit';
      return true;
    }
    return false;
  }

  // Check parent document (for iframe embeds)
  function checkParentTheme(): boolean {
    try {
      if (window.parent !== window) {
        const parentHtml = window.parent.document.documentElement;
        if (parentHtml.classList.contains('dark')) {
          theme = 'dark';
          source = 'parent';
          return true;
        }
        // Parent exists but no dark class
        theme = 'light';
        source = 'parent';
        return true;
      }
    } catch {
      // Cross-origin, can't access parent
    }
    return false;
  }

  // Check system preference
  function checkSystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
    source = 'system';
  }

  // Initial detection
  function detectTheme(): void {
    if (checkExplicitTheme()) return;
    if (checkParentTheme()) return;
    checkSystemTheme();
  }

  // Set up observers for theme changes
  function observe(): () => void {
    const cleanups: Array<() => void> = [];

    // Observe parent document class changes
    try {
      if (window.parent !== window) {
        const parentHtml = window.parent.document.documentElement;
        const observer = new MutationObserver(() => {
          if (source !== 'explicit') {
            const isDark = parentHtml.classList.contains('dark');
            theme = isDark ? 'dark' : 'light';
            source = 'parent';
          }
        });
        observer.observe(parentHtml, {
          attributes: true,
          attributeFilter: ['class'],
        });
        cleanups.push(() => observer.disconnect());
      }
    } catch {
      // Cross-origin, fall through
    }

    // Listen for postMessage theme updates
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'theme-change') {
        theme = event.data.theme === 'dark' ? 'dark' : 'light';
        source = 'parent';
      }
    };
    window.addEventListener('message', messageHandler);
    cleanups.push(() => window.removeEventListener('message', messageHandler));

    // Listen for system preference changes (only if using system theme)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const mediaHandler = (e: MediaQueryListEvent) => {
      if (source === 'system') {
        theme = e.matches ? 'dark' : 'light';
      }
    };
    mediaQuery.addEventListener('change', mediaHandler);
    cleanups.push(() => mediaQuery.removeEventListener('change', mediaHandler));

    return () => cleanups.forEach((fn) => fn());
  }

  // Do initial detection
  detectTheme();

  return {
    get theme() {
      return theme;
    },
    get source() {
      return source;
    },
    get isDark() {
      return theme === 'dark';
    },
    observe,
  };
}
