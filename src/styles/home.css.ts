import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { color, tokens } from "./theme.css";

export const page = style({
  height: "100dvh",
  color: color.ink,
  background: color.paper,
  fontSize: tokens.size.body,
  lineHeight: 1.6,
  display: "flex",
  flexDirection: "column",
  colorScheme: "light",
  selectors: { '&[data-theme="dark"]': { colorScheme: "dark" } },
});
export const main = style({
  width: `min(${tokens.layout.width}, calc(100% - 3rem))`,
  marginInline: "auto",
  paddingTop: tokens.layout.top,
  paddingBottom: tokens.space.small,
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  "@media": {
    "(max-width: 520px)": { paddingTop: tokens.layout.mobileTop },
  },
});
export const directory = style({
  fontSize: tokens.size.utility,
  color: color.subtle,
  marginBottom: tokens.space.small,
});
export const name = style({
  fontSize: tokens.size.name,
  fontWeight: 400,
  lineHeight: 1.4,
  letterSpacing: "-0.02em",
  marginBottom: tokens.space.tiny,
});
export const identities = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: tokens.space.small,
  color: color.secondary,
  width: "100%",
  fontSize: tokens.size.body,
  marginTop: tokens.space.tiny,
  "@media": {
    "(max-width: 520px)": {
      fontSize: "clamp(0.75rem, 3.8vw, 0.9375rem)",
      gap: tokens.space.tiny,
    },
  },
});
export const wordColumn = style({
  position: "relative",
  height: "1.8em",
  overflow: "hidden",
  textAlign: "center",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
});
export const word = style({
  display: "block",
  position: "absolute",
  inset: "0 0 auto 0",
  whiteSpace: "nowrap",
});
export const identityWrap = style({
  position: "relative",
  width: "min(100%, 36.5ch)",
});
export const homeContent = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  selectors: { "&[hidden]": { display: "none" } },
});
const interaction = `${tokens.motion.hover}s cubic-bezier(${tokens.motion.ease.join(",")})`;

export const drawnUnderline = style({
  position: "relative",
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      insetInline: 0,
      bottom: "0.4em",
      height: "1px",
      background: "currentColor",
      transform: "scaleX(0)",
      transformOrigin: "right",
      transition: `transform ${interaction}`,
    },
    "&:is(:hover, :focus-visible)::after": {
      transform: "scaleX(1)",
      transformOrigin: "left",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      selectors: { "&::after": { transition: "none" } },
    },
  },
});

export const textButton = style([
  drawnUnderline,
  {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.3rem 0",
    minHeight: "2.75rem",
    border: 0,
    background: "transparent",
    textAlign: "left",
    textDecoration: "none",
    color: color.secondary,
    selectors: {
      "&:hover": {
        color: color.ink,
      },
    },
    transition: `color ${interaction}`,
  },
]);
export const terminal = style({
  marginTop: "clamp(1.5rem, 4dvh, 2.5rem)",
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
});
export const footer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: tokens.space.medium,
  padding: `0.75rem ${tokens.layout.edge} max(1rem, env(safe-area-inset-bottom))`,
  flexShrink: 0,
  color: color.subtle,
  fontSize: tokens.size.utility,
  "@media": {
    "(max-width: 520px)": {
      gap: tokens.space.small,
      fontSize: "0.8125rem",
    },
  },
});
export const social = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.8rem",
  "@media": { "(max-width: 520px)": { gap: "1rem" } },
});
export const socialLink = style([
  drawnUnderline,
  {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    minHeight: "2.75rem",
    transition: `color ${interaction}`,
    selectors: { "&:is(:hover, :focus-visible)": { color: color.ink } },
  },
]);
globalStyle(`${socialLink} svg`, {
  transition: `transform ${interaction}`,
});
globalStyle(`${socialLink}:is(:hover, :focus-visible) svg`, {
  transform: "translate(0.12em, -0.12em)",
  "@media": { "(prefers-reduced-motion: reduce)": { transform: "none" } },
});
export const themeButton = style([
  textButton,
  {
    justifyContent: "center",
    minWidth: "2.75rem",
    flexShrink: 0,
    padding: 0,
    transition: `transform ${interaction}, color ${interaction}`,
    selectors: {
      "&::after": { display: "none" },
      "&:hover:not(:disabled)": { transform: "rotate(-12deg) scale(1.08)" },
      "&:active:not(:disabled)": { transform: "scale(0.92)" },
    },
    "@media": {
      "(prefers-reduced-motion: reduce)": {
        transition: "none",
        selectors: {
          "&:hover:not(:disabled), &:active:not(:disabled)": {
            transform: "none",
          },
        },
      },
    },
  },
]);
export const themeIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});
export const screenReader = style({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
});
export const playScreen = style({
  minHeight: "100svh",
  background: color.paper,
  color: color.ink,
  position: "relative",
  overflow: "hidden",
});
export const canvas = style({
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  touchAction: "none",
});
export const playTop = style({
  background: color.paper,
  position: "fixed",
  top: tokens.layout.edge,
  left: tokens.layout.edge,
  right: tokens.layout.edge,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: tokens.space.medium,
  fontSize: tokens.size.utility,
});
export const terminalEmulator = style({
  width: "100%",
  flex: 1,
  minHeight: 0,
  outline: "none",
});
globalStyle(`${terminalEmulator} .xterm`, { padding: 0 });
globalStyle(`${terminalEmulator} .xterm-viewport`, { scrollbarWidth: "thin" });

// xterm marks hovered URLs inline; animate that underline without changing its cells.
const terminalLink = `${terminalEmulator} .xterm-rows span[style*="text-decoration: underline"]`;
const drawLine = keyframes({
  from: { transform: "scaleX(0)" },
  to: { transform: "scaleX(1)" },
});
globalStyle(terminalLink, {
  position: "relative",
  textDecoration: "none !important",
});
globalStyle(`${terminalLink}::after`, {
  content: '""',
  position: "absolute",
  insetInline: 0,
  bottom: "0.15em",
  height: "1px",
  background: "currentColor",
  transformOrigin: "left",
  animation: `${drawLine} ${interaction} both`,
  "@media": { "(prefers-reduced-motion: reduce)": { animation: "none" } },
});
