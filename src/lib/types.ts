export interface WalkthroughStep {
  step: number;
  name: string;
  /** Light theme image filename */
  image: string;
  /** Dark theme image filename (optional, falls back to image) */
  imageDark?: string;
  description: string;
  /** Cursor position normalized to 0-1 (x/width, y/height) */
  cursor: { x: number; y: number } | null;
  /** Source folder for images (optional, defaults to walkthrough name) */
  folder?: string;
}

export interface WalkthroughData {
  name: string;
  title: string;
  viewport: { width: number; height: number };
  steps: WalkthroughStep[];
}
