import {
  createTheme,
  createThemeContract,
  globalFontFace,
  globalStyle,
  keyframes,
} from "@vanilla-extract/css";

export const tokens = {
  font: '"Fira Code", monospace',
  size: {
    utility: "0.9375rem",
    body: "1.125rem",
    command: "1.25rem",
    name: "2rem",
  },
  space: {
    tiny: "0.25rem",
    small: "0.75rem",
    medium: "1.5rem",
    large: "2.5rem",
    section: "4rem",
  },
  motion: {
    fast: 0.15,
    word: 0.45,
    wordMin: 3000,
    wordMax: 6000,
    brush: 1600,
    ease: [0.16, 1, 0.3, 1] as const,
  },
  layout: {
    width: "56rem",
    edge: "clamp(1.5rem, 3.45vw, 3.5rem)",
    top: "clamp(1.5rem, 4dvh, 3rem)",
    mobileTop: "clamp(1.5rem, 4dvh, 3rem)",
  },
} as const;

export const color = createThemeContract({
  paper: null,
  ink: null,
  secondary: null,
  subtle: null,
  focus: null,
  selection: null,
});
export const LIGHT_PALETTE = {
  paper: "#fefdfb",
  ink: "#12283c",
  secondary: "#536475",
  subtle: "#60707e",
  focus: "#285ec0",
  selection: "#dce6f0",
};
export const light = createTheme(color, LIGHT_PALETTE);
export const DARK_PALETTE = {
  paper: "#141b22",
  ink: "#e4eaf0",
  secondary: "#b1bdc8",
  subtle: "#95a3b0",
  focus: "#8ab4ff",
  selection: "#334b61",
};
export const dark = createTheme(color, DARK_PALETTE);

globalFontFace("Fira Code", {
  src: 'url("/fonts/fira-code-regular.ttf") format("truetype")',
  fontWeight: 400,
  fontStyle: "normal",
  fontDisplay: "swap",
});
globalStyle("*", { boxSizing: "border-box" });
globalStyle("html", { fontSize: "16px", scrollbarGutter: "stable" });
globalStyle("body", { margin: 0 });
globalStyle("body, input, button", {
  fontFamily: tokens.font,
  fontVariantLigatures: "none",
  WebkitFontSmoothing: "antialiased",
});
globalStyle("button, input", { font: "inherit", color: "inherit" });
globalStyle("button, a, input", { WebkitTapHighlightColor: "transparent" });
globalStyle("button", { cursor: "pointer" });
globalStyle("a", {
  color: "inherit",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.3em",
});
globalStyle("button:focus-visible, a:focus-visible, input:focus-visible", {
  outline: `2px solid ${color.focus}`,
  outlineOffset: "6px",
  borderRadius: "2px",
});
globalStyle("::selection", { background: color.selection, color: color.ink });
globalStyle("h1, h2, p, pre", { margin: 0 });

// Keep the snapshots alive while the brush mask exposes the destination UI.
const holdTheme = keyframes({ from: { opacity: 1 }, to: { opacity: 1 } });
globalStyle("::view-transition-group(root)", { animation: "none" });
globalStyle("::view-transition-image-pair(root)", { isolation: "auto" });
globalStyle("::view-transition-old(root), ::view-transition-new(root)", {
  animation: `${holdTheme} 5s linear both`,
  mixBlendMode: "normal",
});
globalStyle("::view-transition-old(root)", { zIndex: 1 });
globalStyle("::view-transition-new(root)", {
  zIndex: 2,
  maskImage: "var(--theme-brush-mask)",
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
});
