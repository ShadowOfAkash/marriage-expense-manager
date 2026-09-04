# 🎨 Design System Generator — Figma Plugin

A Figma plugin that programmatically generates a complete design system on your current page, including:

- **Color Palette** — Brand shades (50–900), neutral grays, and semantic colors (success, warning, error, info) with registered Figma paint styles
- **Typography Scale** — Configurable type scale (Minor Second → Golden Ratio) with registered Figma text styles
- **Spacing Scale** — Visual spacing reference bars based on a configurable base unit
- **UI Components** — Buttons, input fields, cards, badges, avatars, and toggles

## Quick Start

### 1. Install dependencies

```bash
cd figma-design-system-plugin
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Load in Figma

1. Open the **Figma desktop app**
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select the `manifest.json` from this directory
4. Run the plugin from the Plugins menu

## Configuration Options

| Option | Description |
|---|---|
| **Brand Color** | Primary hex color used to derive the full palette |
| **Shades** | Which shade steps to generate (50, 100, …, 900) |
| **Neutral Palette** | Toggle a parallel gray scale |
| **Font Family** | Choose from Inter, Roboto, Poppins, and more |
| **Base Size** | Root font size in pixels (10–24) |
| **Type Scale** | Ratio for the modular type scale |
| **Components** | Select which UI component types to generate |
| **Spacing Unit** | Base spacing unit in pixels |
| **Spacing Steps** | Number of spacing increments to create |

## What Gets Created

### Figma Styles

The plugin registers **paint styles** and **text styles** in your Figma file so you can reuse them across designs:

- `Brand/50` … `Brand/900` (paint styles)
- `Neutral/50` … `Neutral/900` (paint styles)
- `Semantic/Success`, `Semantic/Warning`, etc. (paint styles)
- `Typography/Display`, `Typography/H1`, …, `Typography/Overline` (text styles)

### Visual Elements

Every element is placed on the current page with proper naming and auto-layout where applicable.

## Project Structure

```
figma-design-system-plugin/
├── manifest.json        # Figma plugin manifest
├── package.json         # Dependencies & scripts
├── tsconfig.json        # TypeScript config
├── src/
│   ├── code.ts          # Main plugin logic (runs in Figma sandbox)
│   └── ui.html          # Plugin UI (runs in iframe)
└── dist/                # Build output (generated)
    ├── code.js
    └── ui.html
```

## Development

```bash
# Watch mode for TypeScript
npm run watch

# You still need to manually copy ui.html after changes:
npm run build:ui
```

## License

MIT
