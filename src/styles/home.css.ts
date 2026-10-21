import { style } from "@vanilla-extract/css";
import { color, tokens } from "./theme.css";

export const page = style({
  minHeight: "100svh",
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
  marginLeft: "32.62%",
  paddingTop: tokens.layout.top,
  paddingBottom: tokens.space.large,
  flex: 1,
  "@media": {
    "(max-width: 800px)": { marginInline: "auto" },
    "(max-width: 520px)": { paddingTop: tokens.layout.mobileTop },
  },
});
export const expandedMain = style({
  paddingTop: "clamp(3rem, 9svh, 6rem)",
  width: `min(${tokens.layout.expanded}, calc(100% - 3rem))`,
  marginLeft: "max(1.5rem, calc(50% - 20rem))",
  "@media": { "(max-width: 800px)": { marginInline: "auto" } },
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
  display: "flex",
  flexDirection: "column",
  selectors: { "&[hidden]": { display: "none" } },
});
export const textButton = style({
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
      textDecoration: "underline",
      textUnderlineOffset: "0.3em",
    },
  },
});
export const terminal = style({ marginTop: "3.6rem" });
export const form = style({
  display: "flex",
  alignItems: "baseline",
  gap: tokens.space.small,
  minHeight: "2.5rem",
  fontSize: tokens.size.command,
  cursor: "text",
  "@media": { "(max-width: 520px)": { gap: "0.5rem", fontSize: "1.0625rem" } },
});
export const prompt = style({
  whiteSpace: "nowrap",
  userSelect: "none",
  flexShrink: 0,
});
export const inputWrap = style({
  position: "relative",
  flex: 1,
  minWidth: 0,
});
export const input = style({
  display: "block",
  width: "100%",
  padding: 0,
  margin: 0,
  minHeight: "2rem",
  border: 0,
  borderRadius: 0,
  background: "transparent",
  caretColor: color.ink,
  outline: "none",
  selectors: {
    "&:focus-visible": { outline: "none", boxShadow: `0 1px 0 ${color.focus}` },
  },
});
export const cursor = style({
  position: "absolute",
  left: 0,
  top: "0.28em",
  width: "0.6em",
  height: "1.1em",
  background: color.ink,
  pointerEvents: "none",
  selectors: { [`${inputWrap}:focus-within &`]: { display: "none" } },
  "@media": { "(prefers-reduced-motion: reduce)": { animation: "none" } },
});
export const hint = style({
  color: color.subtle,
  fontSize: tokens.size.utility,
  marginTop: tokens.space.tiny,
});
export const transcript = style({
  display: "grid",
  gap: tokens.space.large,
  marginBottom: tokens.space.large,
  fontSize: tokens.size.utility,
  overflowWrap: "anywhere",
});
export const historyCommand = style({
  display: "flex",
  gap: tokens.space.small,
  color: color.subtle,
  marginBottom: tokens.space.small,
});
export const response = style({ color: color.secondary, lineHeight: 1.8 });
export const outputList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: tokens.space.small,
});
export const commandRow = style({
  display: "grid",
  gridTemplateColumns: "8ch 1fr",
  gap: tokens.space.medium,
  alignItems: "baseline",
});
export const commandButton = style([
  textButton,
  { minHeight: "2rem", padding: 0, color: color.ink, fontSize: "inherit" },
]);
export const projectRow = style({ display: "grid", gap: tokens.space.tiny });
export const projectLink = style({
  width: "fit-content",
  color: color.ink,
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4em",
});
export const responseParagraph = style({
  marginBottom: tokens.space.small,
  maxWidth: "58ch",
});
export const footer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: tokens.space.medium,
  padding: `1.5rem ${tokens.layout.edge} 2.6rem`,
  color: color.subtle,
  fontSize: tokens.size.utility,
  "@media": {
    "(max-width: 520px)": {
      paddingBottom: tokens.space.medium,
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
export const socialLink = style({
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  minHeight: "2.75rem",
  selectors: { "&:hover": { color: color.ink, textDecoration: "underline" } },
});
export const themeButton = style([
  textButton,
  { justifyContent: "center", minWidth: "2.75rem", flexShrink: 0, padding: 0 },
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
export const playCaption = style({
  background: color.paper,
  position: "fixed",
  bottom: tokens.layout.edge,
  left: tokens.layout.edge,
  right: tokens.layout.edge,
  display: "flex",
  justifyContent: "space-between",
  gap: tokens.space.medium,
  fontSize: tokens.size.utility,
  color: color.secondary,
});

export const playKeyHint = style({
  whiteSpace: "nowrap",
  "@media": { "(max-width: 520px)": { display: "none" } },
});

export const ghost = style({
  position: "absolute",
  top: 0,
  left: 0,
  color: color.subtle,
  whiteSpace: "pre",
  width: "100%",
  overflow: "hidden",
  pointerEvents: "none",
  display: "none",
  selectors: { [`${inputWrap}:focus-within &`]: { display: "block" } },
});
export const ghostPrefix = style({ visibility: "hidden" });
export const completions = style({
  display: "flex",
  flexWrap: "wrap",
  columnGap: tokens.space.medium,
  rowGap: tokens.space.tiny,
  marginTop: tokens.space.small,
  fontSize: tokens.size.utility,
});
