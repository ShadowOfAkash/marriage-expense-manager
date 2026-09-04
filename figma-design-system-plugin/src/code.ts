// ============================================================================
// Design System Generator — Figma Plugin (Main Thread)
// ============================================================================
// Generates a full design system on the current page:
//   • Color palette with configurable shades
//   • Typography scale with registered Figma text styles
//   • Spacing scale
//   • UI Components (buttons, inputs, cards, badges, avatars, toggles)
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluginConfig {
  brandColor: string;       // hex, e.g. "#6366F1"
  shades: number[];         // e.g. [50, 100, …, 900]
  includeNeutrals: boolean;
  fontFamily: string;       // e.g. "Inter"
  baseSize: number;         // px
  typeScale: number;        // ratio
  components: string[];     // e.g. ["buttons", "inputs", …]
  spacingBase: number;      // px
  spacingSteps: number;     // count
}

interface PluginRGB { r: number; g: number; b: number; }
interface PluginHSL { h: number; s: number; l: number; }

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): PluginRGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function rgbToHsl(c: PluginRGB): PluginHSL {
  const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case c.r: h = ((c.g - c.b) / d + (c.g < c.b ? 6 : 0)) / 6; break;
      case c.g: h = ((c.b - c.r) / d + 2) / 6; break;
      case c.b: h = ((c.r - c.g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(hsl: PluginHSL): PluginRGB {
  const s = hsl.s / 100, l = hsl.l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hsl.h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return { r: f(0), g: f(8), b: f(4) };
}

function generateShade(baseHex: string, shade: number): PluginRGB {
  const hsl = rgbToHsl(hexToRgb(baseHex));
  const lightnessMap: Record<number, number> = {
    50: 97, 100: 93, 200: 86, 300: 74, 400: 62,
    500: 50, 600: 42, 700: 34, 800: 26, 900: 18,
  };
  hsl.l = lightnessMap[shade] ?? 50;
  hsl.s = Math.min(hsl.s + 10, 100);
  return hslToRgb(hsl);
}

// ---------------------------------------------------------------------------
// Font loader helper
// ---------------------------------------------------------------------------

async function loadFont(family: string, style: string): Promise<boolean> {
  try {
    await figma.loadFontAsync({ family, style });
    return true;
  } catch {
    // Fallback to Inter if the requested font isn't available
    if (family !== 'Inter') {
      try {
        await figma.loadFontAsync({ family: 'Inter', style });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

function getAvailableFamily(requested: string): string {
  // We attempt to use the requested font; if loading failed, we fall back to Inter.
  // The actual check happens in loadFont, so here we just return the requested one.
  return requested;
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

async function createSectionHeader(
  text: string,
  x: number,
  y: number,
  fontFamily: string,
): Promise<TextNode> {
  const node = figma.createText();
  await loadFont(fontFamily, 'Bold');
  node.fontName = { family: fontFamily, style: 'Bold' };
  node.characters = text;
  node.fontSize = 28;
  node.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 } }];
  node.x = x;
  node.y = y;
  return node;
}

// ---------------------------------------------------------------------------
// 1. COLOR PALETTE
// ---------------------------------------------------------------------------

async function generateColorPalette(
  config: PluginConfig,
  startX: number,
  startY: number,
  fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;

  const header = await createSectionHeader('🎨 Color Palette', startX, startY, fontFamily);
  page.appendChild(header);

  const SWATCH_SIZE = 80;
  const GAP = 12;
  let cursorY = startY + 56;

  // ----- Brand palette -----
  const brandLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  brandLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  brandLabel.characters = 'Brand';
  brandLabel.fontSize = 16;
  brandLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  brandLabel.x = startX;
  brandLabel.y = cursorY;
  page.appendChild(brandLabel);
  cursorY += 32;

  for (let i = 0; i < config.shades.length; i++) {
    const shade = config.shades[i];
    const color = generateShade(config.brandColor, shade);

    // Swatch rectangle
    const rect = figma.createRectangle();
    rect.resize(SWATCH_SIZE, SWATCH_SIZE);
    rect.x = startX + i * (SWATCH_SIZE + GAP);
    rect.y = cursorY;
    rect.cornerRadius = 12;
    rect.fills = [{ type: 'SOLID', color }];
    rect.name = `Brand/${shade}`;
    page.appendChild(rect);

    // Register a Figma color style
    const style = figma.createPaintStyle();
    style.name = `Brand/${shade}`;
    style.paints = [{ type: 'SOLID', color }];

    // Label below swatch
    const label = figma.createText();
    await loadFont(fontFamily, 'Regular');
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = `${shade}`;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.45, g: 0.45, b: 0.45 } }];
    label.x = rect.x + SWATCH_SIZE / 2 - 8;
    label.y = cursorY + SWATCH_SIZE + 6;
    page.appendChild(label);
  }

  cursorY += SWATCH_SIZE + 36;

  // ----- Neutral palette -----
  if (config.includeNeutrals) {
    const neutralLabel = figma.createText();
    neutralLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
    neutralLabel.characters = 'Neutral';
    neutralLabel.fontSize = 16;
    neutralLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
    neutralLabel.x = startX;
    neutralLabel.y = cursorY;
    page.appendChild(neutralLabel);
    cursorY += 32;

    const neutralShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (let i = 0; i < neutralShades.length; i++) {
      const shade = neutralShades[i];
      const lightnessMap: Record<number, number> = {
        50: 98, 100: 96, 200: 90, 300: 83, 400: 64,
        500: 45, 600: 32, 700: 25, 800: 15, 900: 9,
      };
      const l = (lightnessMap[shade] ?? 50) / 100;
      const color: PluginRGB = { r: l, g: l, b: l };

      const rect = figma.createRectangle();
      rect.resize(SWATCH_SIZE, SWATCH_SIZE);
      rect.x = startX + i * (SWATCH_SIZE + GAP);
      rect.y = cursorY;
      rect.cornerRadius = 12;
      rect.fills = [{ type: 'SOLID', color }];
      rect.name = `Neutral/${shade}`;
      page.appendChild(rect);

      const style = figma.createPaintStyle();
      style.name = `Neutral/${shade}`;
      style.paints = [{ type: 'SOLID', color }];

      const label = figma.createText();
      label.fontName = { family: fontFamily, style: 'Regular' };
      label.characters = `${shade}`;
      label.fontSize = 11;
      label.fills = [{ type: 'SOLID', color: { r: 0.45, g: 0.45, b: 0.45 } }];
      label.x = rect.x + SWATCH_SIZE / 2 - 8;
      label.y = cursorY + SWATCH_SIZE + 6;
      page.appendChild(label);
    }

    cursorY += SWATCH_SIZE + 36;
  }

  // ----- Semantic colors (Success, Warning, Error, Info) -----
  const semanticLabel = figma.createText();
  semanticLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  semanticLabel.characters = 'Semantic';
  semanticLabel.fontSize = 16;
  semanticLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  semanticLabel.x = startX;
  semanticLabel.y = cursorY;
  page.appendChild(semanticLabel);
  cursorY += 32;

  const semanticColors: { name: string; hex: string }[] = [
    { name: 'Success', hex: '#22C55E' },
    { name: 'Warning', hex: '#F59E0B' },
    { name: 'Error',   hex: '#EF4444' },
    { name: 'Info',    hex: '#3B82F6' },
  ];

  for (let i = 0; i < semanticColors.length; i++) {
    const { name, hex } = semanticColors[i];
    const color = hexToRgb(hex);

    const rect = figma.createRectangle();
    rect.resize(SWATCH_SIZE, SWATCH_SIZE);
    rect.x = startX + i * (SWATCH_SIZE + GAP);
    rect.y = cursorY;
    rect.cornerRadius = 12;
    rect.fills = [{ type: 'SOLID', color }];
    rect.name = `Semantic/${name}`;
    page.appendChild(rect);

    const style = figma.createPaintStyle();
    style.name = `Semantic/${name}`;
    style.paints = [{ type: 'SOLID', color }];

    const label = figma.createText();
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = name;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.45, g: 0.45, b: 0.45 } }];
    label.x = rect.x + 4;
    label.y = cursorY + SWATCH_SIZE + 6;
    page.appendChild(label);
  }

  cursorY += SWATCH_SIZE + 50;
  return cursorY;
}

// ---------------------------------------------------------------------------
// 2. TYPOGRAPHY
// ---------------------------------------------------------------------------

interface TypeLevel {
  name: string;
  size: number;
  weight: string;
  lineHeight: number;
  letterSpacing: number;
}

function buildTypeScale(baseSize: number, ratio: number): TypeLevel[] {
  const levels: TypeLevel[] = [
    { name: 'Display',    size: Math.round(baseSize * Math.pow(ratio, 5)), weight: 'Bold',      lineHeight: 1.1, letterSpacing: -1.5 },
    { name: 'H1',         size: Math.round(baseSize * Math.pow(ratio, 4)), weight: 'Bold',      lineHeight: 1.2, letterSpacing: -0.5 },
    { name: 'H2',         size: Math.round(baseSize * Math.pow(ratio, 3)), weight: 'Bold',      lineHeight: 1.25, letterSpacing: 0 },
    { name: 'H3',         size: Math.round(baseSize * Math.pow(ratio, 2)), weight: 'Semi Bold', lineHeight: 1.3, letterSpacing: 0 },
    { name: 'H4',         size: Math.round(baseSize * ratio),              weight: 'Semi Bold', lineHeight: 1.35, letterSpacing: 0.25 },
    { name: 'Body Large', size: Math.round(baseSize * 1.125),              weight: 'Regular',   lineHeight: 1.5, letterSpacing: 0.15 },
    { name: 'Body',       size: baseSize,                                  weight: 'Regular',   lineHeight: 1.5, letterSpacing: 0 },
    { name: 'Body Small', size: Math.round(baseSize * 0.875),              weight: 'Regular',   lineHeight: 1.5, letterSpacing: 0.1 },
    { name: 'Caption',    size: Math.round(baseSize * 0.75),               weight: 'Regular',   lineHeight: 1.4, letterSpacing: 0.4 },
    { name: 'Overline',   size: Math.round(baseSize * 0.625),              weight: 'Semi Bold', lineHeight: 1.6, letterSpacing: 1.5 },
  ];
  return levels;
}

async function generateTypography(
  config: PluginConfig,
  startX: number,
  startY: number,
): Promise<number> {
  const page = figma.currentPage;
  const family = config.fontFamily;

  const header = await createSectionHeader('🔤 Typography', startX, startY, family);
  page.appendChild(header);

  let cursorY = startY + 56;
  const levels = buildTypeScale(config.baseSize, config.typeScale);

  for (const level of levels) {
    const loaded = await loadFont(family, level.weight);
    const usedFamily = loaded ? family : 'Inter';

    // Register a Figma text style
    const textStyle = figma.createTextStyle();
    textStyle.name = `Typography/${level.name}`;
    textStyle.fontName = { family: usedFamily, style: level.weight };
    textStyle.fontSize = level.size;
    textStyle.lineHeight = { value: level.size * level.lineHeight, unit: 'PIXELS' };
    textStyle.letterSpacing = { value: level.letterSpacing, unit: 'PIXELS' };

    // Create sample text node
    const textNode = figma.createText();
    textNode.fontName = { family: usedFamily, style: level.weight };
    textNode.characters = `${level.name} — ${level.size}px`;
    textNode.fontSize = level.size;
    textNode.lineHeight = { value: level.size * level.lineHeight, unit: 'PIXELS' };
    textNode.letterSpacing = { value: level.letterSpacing, unit: 'PIXELS' };
    textNode.fills = [{ type: 'SOLID', color: { r: 0.12, g: 0.12, b: 0.12 } }];
    textNode.x = startX;
    textNode.y = cursorY;
    textNode.name = `Type/${level.name}`;
    page.appendChild(textNode);

    // Size info annotation
    const annotation = figma.createText();
    await loadFont(family, 'Regular');
    annotation.fontName = { family: usedFamily, style: 'Regular' };
    annotation.characters = `${level.size}px / ${level.weight} / ${level.lineHeight}× line-height`;
    annotation.fontSize = 11;
    annotation.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
    annotation.x = startX + 520;
    annotation.y = cursorY + (level.size * level.lineHeight) / 2 - 6;
    page.appendChild(annotation);

    cursorY += level.size * level.lineHeight + 16;
  }

  cursorY += 40;
  return cursorY;
}

// ---------------------------------------------------------------------------
// 3. SPACING SCALE
// ---------------------------------------------------------------------------

async function generateSpacingScale(
  config: PluginConfig,
  startX: number,
  startY: number,
  fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;

  const header = await createSectionHeader('📐 Spacing Scale', startX, startY, fontFamily);
  page.appendChild(header);

  let cursorY = startY + 56;
  const brandRgb = hexToRgb(config.brandColor);

  for (let i = 1; i <= config.spacingSteps; i++) {
    const size = config.spacingBase * i;

    const rect = figma.createRectangle();
    rect.resize(size, 24);
    rect.x = startX;
    rect.y = cursorY;
    rect.cornerRadius = 4;
    rect.fills = [{ type: 'SOLID', color: brandRgb, opacity: 0.2 }];
    rect.strokes = [{ type: 'SOLID', color: brandRgb, opacity: 0.5 }];
    rect.strokeWeight = 1;
    rect.name = `Spacing/${size}`;
    page.appendChild(rect);

    const label = figma.createText();
    await loadFont(fontFamily, 'Regular');
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = `${size}px  (${config.spacingBase}×${i})`;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.45, g: 0.45, b: 0.45 } }];
    label.x = startX + size + 16;
    label.y = cursorY + 4;
    page.appendChild(label);

    cursorY += 40;
  }

  cursorY += 40;
  return cursorY;
}

// ---------------------------------------------------------------------------
// 4. UI COMPONENTS
// ---------------------------------------------------------------------------

// Helper: rounded rectangle with fill
function createRoundedRect(
  w: number, h: number, x: number, y: number,
  color: PluginRGB, radius: number, name: string,
  strokeColor?: PluginRGB,
): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(w, h);
  rect.x = x;
  rect.y = y;
  rect.cornerRadius = radius;
  rect.fills = [{ type: 'SOLID', color }];
  rect.name = name;
  if (strokeColor) {
    rect.strokes = [{ type: 'SOLID', color: strokeColor }];
    rect.strokeWeight = 1.5;
  }
  return rect;
}

// --- Buttons ---
async function generateButtons(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  const brandRgb = hexToRgb(brandColor);
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Buttons';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const BTN_H = 44;
  const BTN_W = 160;
  const BTN_GAP = 20;

  const variants: { name: string; bg: PluginRGB; textColor: PluginRGB; stroke?: PluginRGB }[] = [
    { name: 'Primary',   bg: brandRgb, textColor: { r: 1, g: 1, b: 1 } },
    { name: 'Secondary', bg: { r: 1, g: 1, b: 1 }, textColor: brandRgb, stroke: brandRgb },
    { name: 'Ghost',     bg: { r: 0, g: 0, b: 0 }, textColor: brandRgb },
    { name: 'Danger',    bg: hexToRgb('#EF4444'), textColor: { r: 1, g: 1, b: 1 } },
  ];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const x = startX + i * (BTN_W + BTN_GAP);

    const frame = figma.createFrame();
    frame.resize(BTN_W, BTN_H);
    frame.x = x;
    frame.y = cursorY;
    frame.cornerRadius = 10;
    frame.fills = [{ type: 'SOLID', color: v.bg, opacity: v.name === 'Ghost' ? 0 : 1 }];
    frame.name = `Button/${v.name}`;
    if (v.stroke) {
      frame.strokes = [{ type: 'SOLID', color: v.stroke }];
      frame.strokeWeight = 1.5;
    }

    // Layout
    frame.layoutMode = 'HORIZONTAL';
    frame.primaryAxisAlignItems = 'CENTER';
    frame.counterAxisAlignItems = 'CENTER';
    frame.paddingLeft = 24;
    frame.paddingRight = 24;

    const btnText = figma.createText();
    await loadFont(fontFamily, 'Semi Bold');
    btnText.fontName = { family: fontFamily, style: 'Semi Bold' };
    btnText.characters = v.name;
    btnText.fontSize = 14;
    btnText.fills = [{ type: 'SOLID', color: v.textColor }];
    frame.appendChild(btnText);

    page.appendChild(frame);

    // Label
    const label = figma.createText();
    await loadFont(fontFamily, 'Regular');
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = v.name;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
    label.x = x;
    label.y = cursorY + BTN_H + 8;
    page.appendChild(label);
  }

  cursorY += BTN_H + 40;
  return cursorY;
}

// --- Input Fields ---
async function generateInputs(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Input Fields';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const INPUT_W = 280;
  const INPUT_H = 44;
  const variants = [
    { name: 'Default',  placeholder: 'Enter text…',     borderColor: { r: 0.82, g: 0.82, b: 0.82 } },
    { name: 'Focused',  placeholder: 'Focused input',   borderColor: hexToRgb(brandColor) },
    { name: 'Error',    placeholder: 'Invalid input',   borderColor: hexToRgb('#EF4444') },
    { name: 'Disabled', placeholder: 'Disabled input',  borderColor: { r: 0.9, g: 0.9, b: 0.9 } },
  ];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const x = startX + (i % 2) * (INPUT_W + 24);
    const y = cursorY + Math.floor(i / 2) * (INPUT_H + 48);

    const frame = figma.createFrame();
    frame.resize(INPUT_W, INPUT_H);
    frame.x = x;
    frame.y = y;
    frame.cornerRadius = 8;
    frame.fills = [{ type: 'SOLID', color: v.name === 'Disabled' ? { r: 0.96, g: 0.96, b: 0.96 } : { r: 1, g: 1, b: 1 } }];
    frame.strokes = [{ type: 'SOLID', color: v.borderColor }];
    frame.strokeWeight = v.name === 'Focused' ? 2 : 1;
    frame.name = `Input/${v.name}`;

    frame.layoutMode = 'HORIZONTAL';
    frame.primaryAxisAlignItems = 'MIN';
    frame.counterAxisAlignItems = 'CENTER';
    frame.paddingLeft = 14;
    frame.paddingRight = 14;

    const inputText = figma.createText();
    await loadFont(fontFamily, 'Regular');
    inputText.fontName = { family: fontFamily, style: 'Regular' };
    inputText.characters = v.placeholder;
    inputText.fontSize = 14;
    inputText.fills = [{ type: 'SOLID', color: v.name === 'Disabled' ? { r: 0.7, g: 0.7, b: 0.7 } : { r: 0.5, g: 0.5, b: 0.5 } }];
    frame.appendChild(inputText);

    page.appendChild(frame);

    // State label
    const label = figma.createText();
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = v.name;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
    label.x = x;
    label.y = y + INPUT_H + 6;
    page.appendChild(label);
  }

  cursorY += 2 * (INPUT_H + 48) + 20;
  return cursorY;
}

// --- Cards ---
async function generateCards(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  const brandRgb = hexToRgb(brandColor);
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Cards';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const CARD_W = 300;
  const CARD_H = 200;

  for (let i = 0; i < 2; i++) {
    const x = startX + i * (CARD_W + 24);

    const card = figma.createFrame();
    card.resize(CARD_W, CARD_H);
    card.x = x;
    card.y = cursorY;
    card.cornerRadius = 16;
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.effects = [
      { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' },
    ];
    card.name = i === 0 ? 'Card/Default' : 'Card/Outlined';
    card.layoutMode = 'VERTICAL';
    card.paddingTop = 24;
    card.paddingBottom = 24;
    card.paddingLeft = 24;
    card.paddingRight = 24;
    card.itemSpacing = 12;

    if (i === 1) {
      card.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
      card.strokeWeight = 1;
      card.effects = [];
    }

    // Card header image placeholder
    const imgPlaceholder = figma.createRectangle();
    imgPlaceholder.resize(252, 80);
    imgPlaceholder.cornerRadius = 8;
    imgPlaceholder.fills = [{ type: 'SOLID', color: generateShade(brandColor, 100) }];
    imgPlaceholder.name = 'Image Placeholder';
    card.appendChild(imgPlaceholder);

    // Title
    const title = figma.createText();
    await loadFont(fontFamily, 'Semi Bold');
    title.fontName = { family: fontFamily, style: 'Semi Bold' };
    title.characters = 'Card Title';
    title.fontSize = 16;
    title.fills = [{ type: 'SOLID', color: { r: 0.12, g: 0.12, b: 0.12 } }];
    card.appendChild(title);

    // Description
    const desc = figma.createText();
    await loadFont(fontFamily, 'Regular');
    desc.fontName = { family: fontFamily, style: 'Regular' };
    desc.characters = 'Brief description text goes here explaining the card content.';
    desc.fontSize = 13;
    desc.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    desc.resize(252, desc.height);
    desc.textAutoResize = 'HEIGHT';
    card.appendChild(desc);

    page.appendChild(card);
  }

  cursorY += CARD_H + 40;
  return cursorY;
}

// --- Badges ---
async function generateBadges(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Badges';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const badges: { label: string; bgHex: string; textColor: PluginRGB }[] = [
    { label: 'New',      bgHex: brandColor,  textColor: { r: 1, g: 1, b: 1 } },
    { label: 'Success',  bgHex: '#DCFCE7',   textColor: hexToRgb('#166534') },
    { label: 'Warning',  bgHex: '#FEF3C7',   textColor: hexToRgb('#92400E') },
    { label: 'Error',    bgHex: '#FEE2E2',   textColor: hexToRgb('#991B1B') },
    { label: 'Info',     bgHex: '#DBEAFE',   textColor: hexToRgb('#1E40AF') },
    { label: 'Neutral',  bgHex: '#F3F4F6',   textColor: hexToRgb('#374151') },
  ];

  let x = startX;
  for (const badge of badges) {
    const frame = figma.createFrame();
    frame.cornerRadius = 100;
    frame.fills = [{ type: 'SOLID', color: hexToRgb(badge.bgHex) }];
    frame.layoutMode = 'HORIZONTAL';
    frame.primaryAxisAlignItems = 'CENTER';
    frame.counterAxisAlignItems = 'CENTER';
    frame.paddingLeft = 12;
    frame.paddingRight = 12;
    frame.paddingTop = 4;
    frame.paddingBottom = 4;
    frame.name = `Badge/${badge.label}`;

    const text = figma.createText();
    await loadFont(fontFamily, 'Semi Bold');
    text.fontName = { family: fontFamily, style: 'Semi Bold' };
    text.characters = badge.label;
    text.fontSize = 11;
    text.fills = [{ type: 'SOLID', color: badge.textColor }];
    frame.appendChild(text);

    frame.x = x;
    frame.y = cursorY;

    // Need to wait a frame to get accurate size
    page.appendChild(frame);
    x += frame.width + 12;
  }

  cursorY += 48;
  return cursorY;
}

// --- Avatars ---
async function generateAvatars(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  const brandRgb = hexToRgb(brandColor);
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Avatars';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const sizes = [
    { name: 'XS', diameter: 24, fontSize: 10 },
    { name: 'SM', diameter: 32, fontSize: 12 },
    { name: 'MD', diameter: 40, fontSize: 14 },
    { name: 'LG', diameter: 56, fontSize: 20 },
    { name: 'XL', diameter: 72, fontSize: 26 },
  ];

  let x = startX;
  for (const sz of sizes) {
    const frame = figma.createFrame();
    frame.resize(sz.diameter, sz.diameter);
    frame.cornerRadius = sz.diameter / 2;
    frame.fills = [{ type: 'SOLID', color: generateShade(brandColor, 200) }];
    frame.layoutMode = 'HORIZONTAL';
    frame.primaryAxisAlignItems = 'CENTER';
    frame.counterAxisAlignItems = 'CENTER';
    frame.name = `Avatar/${sz.name}`;
    frame.x = x;
    frame.y = cursorY;

    const initials = figma.createText();
    await loadFont(fontFamily, 'Semi Bold');
    initials.fontName = { family: fontFamily, style: 'Semi Bold' };
    initials.characters = 'AB';
    initials.fontSize = sz.fontSize;
    initials.fills = [{ type: 'SOLID', color: generateShade(brandColor, 700) }];
    frame.appendChild(initials);

    page.appendChild(frame);

    // Label
    const label = figma.createText();
    await loadFont(fontFamily, 'Regular');
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = sz.name;
    label.fontSize = 10;
    label.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
    label.x = x + sz.diameter / 2 - 6;
    label.y = cursorY + sz.diameter + 6;
    page.appendChild(label);

    x += sz.diameter + 20;
  }

  cursorY += 72 + 36;
  return cursorY;
}

// --- Toggles ---
async function generateToggles(
  brandColor: string, startX: number, startY: number, fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;
  const brandRgb = hexToRgb(brandColor);
  let cursorY = startY;

  const subLabel = figma.createText();
  await loadFont(fontFamily, 'Semi Bold');
  subLabel.fontName = { family: fontFamily, style: 'Semi Bold' };
  subLabel.characters = 'Toggles';
  subLabel.fontSize = 16;
  subLabel.fills = [{ type: 'SOLID', color: { r: 0.25, g: 0.25, b: 0.25 } }];
  subLabel.x = startX;
  subLabel.y = cursorY;
  page.appendChild(subLabel);
  cursorY += 36;

  const TRACK_W = 48;
  const TRACK_H = 28;
  const KNOB_SIZE = 22;

  const variants = [
    { name: 'Off',      trackColor: { r: 0.88, g: 0.88, b: 0.88 }, knobX: 3 },
    { name: 'On',       trackColor: brandRgb,                        knobX: TRACK_W - KNOB_SIZE - 3 },
    { name: 'Disabled', trackColor: { r: 0.93, g: 0.93, b: 0.93 }, knobX: 3 },
  ];

  let x = startX;
  for (const v of variants) {
    // Track
    const track = figma.createFrame();
    track.resize(TRACK_W, TRACK_H);
    track.x = x;
    track.y = cursorY;
    track.cornerRadius = TRACK_H / 2;
    track.fills = [{ type: 'SOLID', color: v.trackColor }];
    track.name = `Toggle/${v.name}`;
    track.clipsContent = false;

    // Knob
    const knob = figma.createEllipse();
    knob.resize(KNOB_SIZE, KNOB_SIZE);
    knob.x = v.knobX;
    knob.y = 3;
    knob.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    knob.effects = [
      { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' },
    ];
    knob.name = 'Knob';
    track.appendChild(knob);

    page.appendChild(track);

    // Label
    const label = figma.createText();
    await loadFont(fontFamily, 'Regular');
    label.fontName = { family: fontFamily, style: 'Regular' };
    label.characters = v.name;
    label.fontSize = 11;
    label.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
    label.x = x;
    label.y = cursorY + TRACK_H + 6;
    page.appendChild(label);

    x += TRACK_W + 32;
  }

  cursorY += TRACK_H + 48;
  return cursorY;
}

async function generateComponents(
  config: PluginConfig,
  startX: number,
  startY: number,
  fontFamily: string,
): Promise<number> {
  const page = figma.currentPage;

  const header = await createSectionHeader('🧩 UI Components', startX, startY, fontFamily);
  page.appendChild(header);

  let cursorY = startY + 56;

  const generators: Record<string, (bc: string, x: number, y: number, f: string) => Promise<number>> = {
    buttons:  generateButtons,
    inputs:   generateInputs,
    cards:    generateCards,
    badges:   generateBadges,
    avatars:  generateAvatars,
    toggles:  generateToggles,
  };

  for (const comp of config.components) {
    const gen = generators[comp];
    if (gen) {
      cursorY = await gen(config.brandColor, startX, cursorY, fontFamily);
    }
  }

  return cursorY;
}

// ---------------------------------------------------------------------------
// Plugin entrypoint
// ---------------------------------------------------------------------------

figma.showUI(__html__, { width: 420, height: 680, themeColors: true });

figma.ui.onmessage = async (msg: { type: string; config?: PluginConfig }) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }

  if (msg.type === 'generate' && msg.config) {
    const config = msg.config;
    const START_X = 100;
    let cursorY = 100;

    try {
      // Rename the page
      figma.currentPage.name = '🎨 Design System';

      figma.ui.postMessage({ type: 'status', message: '⏳ Generating color palette…', status: 'info' });
      cursorY = await generateColorPalette(config, START_X, cursorY, config.fontFamily);

      figma.ui.postMessage({ type: 'status', message: '⏳ Generating typography…', status: 'info' });
      cursorY = await generateTypography(config, START_X, cursorY);

      figma.ui.postMessage({ type: 'status', message: '⏳ Generating spacing scale…', status: 'info' });
      cursorY = await generateSpacingScale(config, START_X, cursorY, config.fontFamily);

      if (config.components.length > 0) {
        figma.ui.postMessage({ type: 'status', message: '⏳ Generating UI components…', status: 'info' });
        cursorY = await generateComponents(config, START_X, cursorY, config.fontFamily);
      }

      // Zoom to fit
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);

      figma.ui.postMessage({
        type: 'status',
        message: '✅ Design system generated successfully!',
        status: 'success',
      });

      figma.notify('✅ Design system generated!', { timeout: 3000 });

    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error('Design System Generator Error:', errorMsg);
      figma.ui.postMessage({
        type: 'status',
        message: `❌ Error: ${errorMsg}`,
        status: 'error',
      });
      figma.notify(`❌ Error: ${errorMsg}`, { timeout: 5000, error: true });
    }
  }
};
