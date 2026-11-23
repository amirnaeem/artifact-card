/** Fully themeable level-card primitive types. */

/** Accent tile. Prefer `fill` (exact color); `colorIndex` indexes theme.accents. */
export type AccentCell = { c: number; r: number; colorIndex?: number; fill?: string };

export type GridSpec = {
  cols: number;
  rows: number;
  originX: number;
  originY: number;
  /** Square fallback size when cellW/cellH omitted. */
  cell: number;
  gap: number;
  /** Wider tiles fill left/right without eating the label band (height stays `cell`). */
  cellW?: number;
  cellH?: number;
  gapX?: number;
  gapY?: number;
  /**
   * Extra solid columns on each side so the mosaic fills the card width.
   * void/accent/body maps stay in content coordinates (0 .. contentCols-1).
   */
  padCols?: number;
  /** Width of the puzzle content region; defaults to cols - 2*padCols. */
  contentCols?: number;
  /** Cells omitted from the mosaic (lower-right void, etc.). Content coords. */
  voidCells: Array<[number, number]>;
  accentCells: AccentCell[];
  /** Optional body fill override per cell; when set, primary is ignored for that cell. */
  bodyCells?: Array<{ c: number; r: number; fill: string }>;
};

export type LevelCardTheme = {
  background: string;
  primary: string;
  accents: string[];
  titleColor: string;
  captionColor: string;
  markColor: string;
  brandColor: string;
  nameColor: string;
  metaColor: string;
  fonts: {
    title: string;
    caption: string;
    brand: string;
    name: string;
    meta: string;
  };
  type: {
    titleSize: number;
    titleWeight: number;
    captionSize: number;
    captionWeight: number;
    brandSize: number;
    brandWeight: number;
    nameSize: number;
    nameWeight: number;
    metaSize: number;
    metaWeight: number;
  };
  grid: GridSpec;
};

export type LevelCardPreset = {
  name: string;
  caption: string;
  theme: Partial<LevelCardTheme>;
  /**
   * Paint face art into mosaic tiles / under-panel gaps.
   * Also enabled when the host passes `artSrc`.
   */
  artFace?: boolean;
  /**
   * Progressive mosaic reveal ladder id (e.g. `"ninja"`).
   * Rank changes within the same ladder animate void fill-in.
   */
  revealLadder?: string;
};

export type LevelCardProps = {
  /**
   * Award level name (any preset, or a custom host name with `title` / `theme`).
   * Reading and Ninja are two built-in categories; more can be added via `defineCategory`.
   */
  level?: string;
  /** Category id (`reading`, `ninja`, …). Inferred from `level` when omitted. */
  category?: string;
  theme?: Partial<LevelCardTheme>;
  title?: string;
  caption?: string;
  fullName?: string;
  memberSince?: string;
  /** Back brand line; omitted when empty (no default). */
  brand?: string;
  /** Show the back mark (asterisk or `markSrc`). Default true. */
  showMark?: boolean;
  /** Face art URL. Enables art face when set; art-face presets default to packaged art. */
  artSrc?: string;
  /** Mark/logo URL; replaces the default asterisk on front + back. */
  markSrc?: string;
  side?: "front" | "back";
  /** Mosaic-only face (no title/caption); cropped to the tile grid. */
  mini?: boolean;
  /** Step-animate accent tiles (Beginner→Savant). Default off. */
  flicker?: boolean;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  /** Optional host notification (tilt permission failures, etc.). */
  onNotify?: (message: string) => void;
  className?: string;
  size?: number;
};

export type GridCell = {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  accent: boolean;
  /** Temporary tile that carves away to reveal the puzzle void. */
  carve: boolean;
  index: number;
  col: number;
  row: number;
};
