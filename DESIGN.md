---
name: Aaron Cassar
description: A quiet personal page with a working browser terminal.
colors:
  ink: "#12283c"
  secondary: "#536475"
  subtle: "#60707e"
  paper: "#fefdfb"
  focus: "#285ec0"
  selection: "#dce6f0"
  dark-ink: "#e4eaf0"
  dark-secondary: "#b1bdc8"
  dark-subtle: "#95a3b0"
  dark-paper: "#141b22"
  dark-focus: "#8ab4ff"
  dark-selection: "#334b61"
typography:
  name:
    fontFamily: '"Fira Code", monospace'
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Fira Code", monospace'
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  command:
    fontFamily: '"Fira Code", monospace'
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.6
  utility:
    fontFamily: '"Fira Code", monospace'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  field: "0px"
  focus: "2px"
spacing:
  tiny: "0.25rem"
  small: "0.75rem"
  medium: "1.5rem"
  large: "2.5rem"
components:
  text-action:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.command}"
    padding: "0.3rem 0"
  text-action-hover:
    textColor: "{colors.ink}"
  terminal-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.command}"
    rounded: "{rounded.field}"
    padding: "0"
    width: "100%"
  identity-columns:
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
  utility-link:
    textColor: "{colors.subtle}"
    typography: "{typography.utility}"
  theme-control:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    padding: "0"
---

# Design System: Aaron Cassar

## Overview

**Creative North Star: "A quiet page with a secret terminal"**

A compact personal introduction typeset like a live text program on a light sheet. Self-hosted monospace, blue-black ink, steel text, and generous whitespace establish the approved quiet, coder-like character.

The visible prompt is a working browser terminal. Three independently changing identity words add restrained motion; the monochrome ASCII field remains a discovery behind a command. Interaction supplies the surprise without adding desktop-window decoration.

**Key Characteristics:**
- One self-hosted monospace family with modest size changes.
- Paper and ink, with steel supporting text and explicit keyboard focus.
- Compact text groups surrounded by generous whitespace.
- Independent centered identity motion with reduced-motion support.
- Text actions and a real prompt instead of interface chrome.

## Colors

The palette is nearly monochrome: blue-black text on warm paper, with steel tones for quieter content. Frontmatter values are normative and come from the implemented theme contract.

### Primary

- **Ink:** the name, prompt, caret, output links, and hovered text actions.
- **Focus blue:** keyboard outlines and the input underline. It is an interaction color, not a decorative accent.

### Secondary

- **Steel:** identity words, completion suggestions, and terminal responses.
- **Subtle steel:** directory, hint, transcript command markers, and footer utilities.

### Neutral

- **Paper:** the uninterrupted page and playground background.
- **Selection wash:** selected text behind ink.
- **Dark roles:** switch all six roles together to dark paper, pale ink, lighter steel, and the corresponding focus and selection colors. Preserve the same hierarchy.

**The Semantic Ink Rule.** Use ink for the name, prompt, and actionable output; use secondary for supporting content and subtle for utilities. Focus and selection colors serve interaction only.

## Typography

All text uses self-hosted Fira Code Regular, served from `/fonts/fira-code-regular.ttf`, with a monospace stack. The base root size is (16px). There is no separate display face or bold headline treatment.

### Hierarchy

- **Name:** the largest role, reserved for the personal name.
- **Command:** the prompt.
- **Body:** identity words and default page text.
- **Utility:** directory, hints, transcript, and footer. Terminal responses use a more open line height (1.8) and paragraphs stop at (58ch).
- **Mobile adjustments:** at (520px), identities use (clamp(0.75rem, 3.8vw, 0.9375rem)) so the longest pool word fits even at 320px, the prompt becomes (1.0625rem), and the footer becomes (0.8125rem).

**The One Face Rule.** Use Fira Code throughout, with regular weight and size, spacing, and tone establishing hierarchy. Disable ligatures so command text stays literal.

## Layout

The initial homepage is a compact, left-aligned text composition within a generous empty field. Its content width is capped at (32.5rem), with (1.5rem) minimum side clearance. On wide screens the left edge sits at (32.62%) and the top begins at (34.1svh). Below (800px) the column centers horizontally; below (520px) its top becomes (22svh).

The initial page has no work/about/contact navigation row. The terminal starts (3.6rem) below the identity. Once output appears, the column expands to (42rem) and moves toward the top with padding of (clamp(3rem, 9svh, 6rem)). Transcript groups use the large spacing step; individual rows use the small step.

A flex page holds the footer below the main composition. Social links sit left, the theme control right. Footer edge spacing uses (clamp(1.5rem, 3.45vw, 3.5rem)); mobile utility links wrap as needed.

## Elevation & Depth

No decorative shadows, cards, or raised containers appear. Paper remains continuous. The only box-shadow is the one-pixel input focus underline, which communicates keyboard state without creating depth.

**The Flat Paper Rule.** Keep the homepage flat. Whitespace, text color, and ordering supply hierarchy; the input focus underline supplies state rather than elevation.

## Shapes

The form language is text-first and borderless. The terminal input is square and transparent. The resting prompt indicator is a small solid rectangle (0.6em by 1.1em). Focus outlines have a slight corner radius and sit outside text controls (2px stroke, 6px offset). Lucide outline icons supply small external-link arrows, theme, pause, play, and back controls.

## Components

### Text actions

Work, about, and contact are typed commands, without a separate navigation row. Transcript suggestions and completion options are transparent utility-size text buttons; selecting one fills the prompt and Enter executes. Hover adds an underline and keyboard focus uses the shared outline.

### Terminal input and transcript

A genuine labeled input follows `visitor@aaron ~ %`, without a field border or surrounding window. A static block indicates the empty unfocused prompt; focus replaces it with the native caret and a focus underline. Hints sit immediately below in subtle text. Output is stacked semantic text with command markers, lists, and links; errors remain readable text within the same palette.

A native input supplies selection, touch keyboards, and a caret. Inline ghost text and a wrapping row of matching commands appear while typing. Tab and Shift-Tab cycle matches; Right Arrow accepts the ghost; Enter executes. Empty Tab lists options. Escape clears and leaves the input. History arrows and Ctrl-A/E/U/K/W/C/L support shell-style editing. The browser-only command resolver is allowlisted. Clear, themes, and exit operate on this page. The terminal evaluates neither JavaScript nor operating-system commands.

### Identity columns

Three separately clipped columns start as founder, engineer, designer. Equal-width tracks within (min(100%, 36.5ch)) and a clipped height (1.8em) keep changing words from reflowing the composition. Each word slides vertically and fades over (450ms), using (cubic-bezier(0.16, 1, 0.3, 1)). Each column independently chooses a new random delay between (3000ms) and (6000ms) after every change. All three draw randomly from the same pool, excluding currently displayed and still-exiting words.

The stable accessible identity is “Founder, engineer, designer.” Changing visual words are hidden from assistive technology. Each word is centered within its column. There is no manual pause control, as explicitly requested by the user. Motion stops for reduced motion, offscreen content, expanded terminal content, and the hidden page.

### Footer utilities and theme control

Footer links are ordered GitHub, Resume, LinkedIn, without accents on Resume. Social links are understated text with small external-link arrows. Hover adds ink and an underline; keyboard focus uses the shared outline. The transparent theme button uses a Sun or Moon outline within a minimum (2.75rem) target and reveals the complete destination theme through six overlapping, randomly ordered brush strokes over 1250ms. Native view snapshots preserve the whole interface: every stroke exposes the destination text, controls, and background together. Closely packed bristles give each pass an irregular edge; direction, angle, and stroke order vary each time. There is no final UI fade. The icon rotates and settles. The terminal theme command uses the same transition. Reduced motion switches immediately.

### Hidden ASCII field

`ls -a` reveals `./play`. The field uses theme ink over paper at reduced opacity (0.58), with a self-hosted monospace character grid. Pointer movement reshapes waves and presses create ripples. Back, Escape, and pause controls stay plainly readable against paper. Reduced motion keeps the field still; returning restores the transcript and prompt focus. This full-screen expression belongs to the discovered playground rather than the initial composition.

## Do's and Don'ts

### Do:

- Do use the semantic palette roles together when switching themes.
- Do keep text actions keyboard accessible with visible focus.
- Do keep founder, engineer, designer as the initial and stable accessible identity.
- Do preserve independent word timing, centered alignment, and reduced-motion behavior.
- Do keep terminal output readable as semantic text and genuine links.

### Don't:

- Don't add cards, window chrome, or decorative shadows to this homepage.
- Don't enlarge the name into an oversized marketing headline.
- Don't replace the approved identity with the superseded software-engineer subtitle.
- Don't expose the ASCII field as decoration in the first viewport.
- Don't disguise arbitrary code execution as a terminal command.
