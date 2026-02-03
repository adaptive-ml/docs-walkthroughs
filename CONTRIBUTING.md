# Walkthroughs

Interactive UI walkthrough component for Adaptive docs. Displays screenshots with animated cursor overlays, embedded via iframe in Mintlify docs.

## Architecture

```
walkthroughs/
├── public/
│   └── walkthroughs/             # Output images + metadata
│       └── {walkthrough-name}/
│           ├── walkthrough.json  # Step metadata with cursor coords
│           └── step*.webp         # Screenshots (1280x800, JPEG q85)
├── src/
│   ├── lib/
│   │   ├── types.ts              # WalkthroughData, WalkthroughStep
│   │   ├── Walkthrough.svelte    # Main container
│   │   ├── WalkthroughImage.svelte   # Image with fade transitions
│   │   ├── WalkthroughCursor.svelte  # Animated cursor (svelte/motion)
│   │   └── components/WalkthroughNav.svelte # Navigation dots/arrows
│   ├── App.svelte                # Entry point, parses ?walkthrough=name
│   └── main.ts
└── CONTRIBUTING.md
```

## Development

```bash
cd walkthroughs

# Install dependencies
bun install

# Start dev server (http://localhost:5173)
bun run dev

# Type check
bun run check

# Build for production
bun run build
```

## Capturing Walkthroughs

Walkthroughs are captured using Python scripts with Playwright.

### Quick Start

```bash
cd walkthroughs

# List available flows
python -m capture --list

# Authenticate (first time only)
python -m capture --auth

# Capture a walkthrough
python -m capture create-usecase

# Run with visible browser
python -m capture create-usecase --headed
```

### Adding New Flows

Create a new file in `capture/flows/` (e.g., `my_flow.py`):

```python
from capture.core import Metadata, Step

METADATA = Metadata(
    name="my-flow",
    title="My Flow Title",
)

START_PATH = ""  # Path relative to base URL

STEPS = [
    Step(
        name="step_name",
        description="What this step shows",
        selector="button.my-button",  # For cursor position
        action="click",  # click, fill, wait, press, navigate
        action_args={"selector": "button.my-button"},
    ),
    Step(
        name="result",
        description="Final result",
        cursor=None,  # No cursor on last step
    ),
]
```

### Requirements

- **Viewport**: 1280x800 (fixed)
- **Format**: WebP, quality 80
- **Themes**: Both light and dark variants for each step
- **Cursor**: Normalized coordinates (0-1 range)

## Step Design Pattern

**N user actions = N+1 steps**

Each step shows cursor position BEFORE the click happens. The cursor animates to show where to click next.

- Steps 1 to N: Show cursor pointing at each action
- Step N+1: Show the final result (cursor = null)

**Example - Attach Model (4 steps for 3 actions)**:
```
Step 1: cursor → "Attach model" button    (action: click button)
Step 2: cursor → model dropdown           (action: open dropdown)
Step 3: cursor → model option             (action: select model)
Step 4: cursor → "Attach" button          (result)
```

## Metadata Format

`walkthrough.json` schema:

```json
{
  "name": "attach-model",
  "title": "Attach a Model",
  "viewport": { "width": 1280, "height": 800 },
  "steps": [
    {
      "step": 1,
      "name": "overview",
      "image": "step01_overview_light.webp",
      "imageDark": "step01_overview_dark.webp",
      "description": "Click 'Attach model' to add a model to your use case",
      "cursor": { "x": 0.943, "y": 0.248 }
    }
  ]
}
```

- `cursor`: Normalized coordinates (0-1). Set `null` on final step only.
- `image` / `imageDark`: Light and dark theme variants
- `viewport`: Reference dimensions (1280x800). Used for aspect ratio.

## Embedding in Docs

In Mintlify MDX:

```mdx
<iframe
  src="https://adaptive-ml.github.io/docs-walkthroughs/?walkthrough=attach-model"
  width="100%"
  height="500px"
  style={{ borderRadius: '8px', border: 'none' }}
/>
```

## Maintenance

### Re-capture when UI changes

**Step 1: Explore with Playwright MCP**

Before updating capture scripts, use the Playwright MCP server to manually explore the UI:

```
# Use Claude Code with Playwright MCP to:
mcp__playwright__browser_navigate(url="https://...")
mcp__playwright__browser_snapshot()  # Get element refs
mcp__playwright__browser_click(ref="e123")
mcp__playwright__browser_take_screenshot()
```

This "dry run" approach lets you:
- Discover new selectors after UI changes
- Verify the flow works end-to-end
- Identify wait conditions needed

**Step 2: Update and run capture scripts**

1. Update selectors in the flow file based on MCP exploration
2. Run `python -m capture <flow-name>`
3. Verify in dev server
4. Commit updated images + metadata

### Capture Settings

- **Resolution**: All screenshots are captured at exactly 1280x800 pixels
- **Coordinates**: Stored as normalized 0-1 values for resolution-independent positioning
- **Themes**: Light and dark captured via localStorage + body.dark class toggle
- **Auth**: Cookies saved to `capture/.auth_cookies.json`

## Tech Stack

- **Capture**: Python + Playwright
- **Viewer**: Svelte 5 + Vite + TypeScript
- **Animation**: `svelte/motion` Spring for cursor, `svelte/transition` for images
- **Hosting**: GitHub Pages (planned)

## Key Files

| File | Purpose |
|------|---------|
| `capture/core.py` | Shared browser/capture utilities |
| `capture/flows/*.py` | Flow definitions for each walkthrough |
| `src/lib/Walkthrough.svelte` | Main component - loads JSON, manages state |
| `src/lib/WalkthroughCursor.svelte` | Spring-animated cursor overlay |
| `public/walkthroughs/*/walkthrough.json` | Metadata driving animations |
