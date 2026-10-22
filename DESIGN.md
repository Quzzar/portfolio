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

A compact personal introduction above a wide terminal, typeset like a live text program on a light sheet. Self-hosted monospace, blue-black ink, steel text, and generous whitespace establish the approved quiet, coder-like character.

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
- **Utility:** directory, hints, transcript, and footer. The xterm terminal uses 18px type on desktop and 15px on mobile, with its lineHeight option set to 1.3.
- **Mobile adjustments:** at (520px), identities use (clamp(0.75rem, 3.8vw, 0.9375rem)) so the longest pool word fits even at 320px, the prompt becomes (1.0625rem), and the footer becomes (0.8125rem).

**The One Face Rule.** Use Fira Code throughout, with regular weight and size, spacing, and tone establishing hierarchy. Disable ligatures so command text stays literal.

## Layout

The initial homepage is a compact, left-aligned text composition within a generous empty field. Its centered content width is capped at (56rem), with (1.5rem) minimum side clearance. The top inset is (clamp(1.5rem, 4dvh, 3rem)). The page occupies the dynamic viewport height; header and footer remain visible while terminal output scrolls internally.

The initial page has no work/about/contact navigation row. The terminal starts (clamp(1.5rem, 4dvh, 2.5rem)) below the identity. The column and header keep the same position and width during typing, completion, and output. The terminal fills the available height between the identity and footer and retains output in scrollback.

A flex page holds the footer below the main composition. Social links sit left, the theme control right. Footer edge spacing uses (clamp(1.5rem, 3.45vw, 3.5rem)); mobile utility links wrap as needed.

## Elevation & Depth

No decorative shadows, cards, or raised containers appear. Paper remains continuous. The only box-shadow is the one-pixel input focus underline, which communicates keyboard state without creating depth.

**The Flat Paper Rule.** Keep the homepage flat. Whitespace, text color, and ordering supply hierarchy; the input focus underline supplies state rather than elevation.

## Shapes

The page is text-first and borderless. xterm renders the terminal surface and a solid block cursor without an input underline or field outline. External controls keep their shared focus outlines. Lucide icons supply small external-link arrows, theme, pause, play, and back controls.

## Components

### Terminal emulator

The user explicitly requested an actual terminal emulator. Use xterm.js with the incremental xterm-readline controller, fit addon, and web-links addon. The visible shell prompt is `visitor@aaron ~ % `. The emulator owns cursor rendering, selection, wrapped lines, transcript, scrollback, and its accessibility tree. Its hidden textarea captures keyboard/IME input; there is no visible HTML text field or form.

Tab completes unique command and filename tokens immediately. For ambiguous tokens it first lists choices without changing the typed token; the next Tab selects the first match. Repeated Tab cycles forward through the original matches; Shift-Tab reverses. Further typing and caret movement end that cycle. Completion preserves following arguments. No external suggestion buttons or ghost text appear. Arrow keys support history and editing, Home/End and Ctrl-A/E move the cursor, Ctrl-C cancels, Ctrl-L clears, and Escape exits terminal focus. Shift-Tab leaves the emulator when completion is inactive. Option-arrow navigation, Option-Backspace, Command-arrow line navigation, Ctrl-W deletion, and Ctrl-B/F/P/N movement/history follow familiar Mac editing conventions. Commands are browser-only and allowlisted. Output uses terminal text with activatable URLs. A block cursor remains visible in both themes.

The emulator loads separately from the homepage and fits its columns to the container, including mobile. Its height flexes with the available viewport space, with 1000 lines of scrollback and a 50-command history. Normal typing appends characters without clearing or reprinting the prompt. Cursor edits redraw the input atomically. A fit operation only runs when rows, columns, or font size change; navigation keys prevent native page scrolling. Themes update the existing instance without resetting its session.

### Identity columns

Three separately clipped columns start as founder, engineer, designer. Equal-width tracks within (min(100%, 36.5ch)) and a clipped height (1.8em) keep changing words from reflowing the composition. Each word slides vertically and fades over (450ms), using (cubic-bezier(0.16, 1, 0.3, 1)). Each column independently chooses a new random delay between (3000ms) and (6000ms) after every change. All three draw randomly from the same pool, excluding currently displayed and still-exiting words.

The stable accessible identity is “Founder, engineer, designer.” Changing visual words are hidden from assistive technology. Each word is centered within its column. There is no manual pause control, as explicitly requested by the user. Motion stops for reduced motion, offscreen content, and the hidden page. Terminal output never pauses identity motion.

### Footer utilities and theme control

Footer links are ordered GitHub, Resume, LinkedIn, without accents on Resume. Social links are understated text with small external-link arrows. Hover and keyboard focus draw an underline from left to right over 280ms, and external-link arrows move slightly outward. Keyboard focus retains the shared outline. Terminal URL hover draws the same underline without animating command output. The transparent theme button uses a Sun or Moon outline within a minimum (2.75rem) target. Activating it or submitting `theme` seeds a territory simulation at the trigger. A curved fluid boundary exposes the complete alternate palette, with waves that advance and retreat. The underlying grid, factories, and reinforcements are not visible. A live inert visual mirror keeps text and terminal output synchronized across both palettes. Attacks consume reserves, factories replenish them, and both sides can win. Playback lasts about 12.7 seconds, including surrender. The incoming side is strongly favored but a defending victory retains the original theme. Page interactions continue normally throughout the battle. Additional theme requests are ignored until it ends. Reduced motion switches immediately. There are no battle instructions, banners, scores, or added permanent UI.

### Hidden ASCII field

`ls -a` reveals `./play`. The field uses theme ink over paper at reduced opacity (0.58), with a self-hosted monospace character grid. Pointer movement reshapes waves and presses create ripples. Back, Escape, and pause controls stay plainly readable against paper. Reduced motion keeps the field still; returning restores the transcript and prompt focus. This full-screen expression belongs to the discovered playground rather than the initial composition.

## Do's and Don'ts

### Do:

- Do use the semantic palette roles together when switching themes.
- Do keep text actions keyboard accessible with visible focus.
- Do keep founder, engineer, designer as the initial and stable accessible identity.
- Do preserve independent word timing, centered alignment, and reduced-motion behavior.
- Do keep the xterm session selectable, accessible, and its URLs activatable.

### Don't:

- Don't add cards, window chrome, or decorative shadows to this homepage.
- Don't enlarge the name into an oversized marketing headline.
- Don't replace the approved identity with the superseded software-engineer subtitle.
- Don't expose the ASCII field as decoration in the first viewport.
- Don't disguise arbitrary code execution as a terminal command.

### Terminal workspace

The main column is centered and up to 56rem wide. The page occupies `100dvh`, with a top inset of `clamp(1.5rem, 4dvh, 3rem)`. The terminal fills remaining space between the header and footer with no fixed minimum height; output scrolls inside it. Typing and output do not change page geometry. Help lists command names only. Other responses contain factual text, file names, or links without greetings, encouragement, or interaction instructions.

Link underlines draw on hover and keyboard focus, including URLs inside xterm. External-link arrows move slightly outward, and the theme control turns on hover and presses inward on click. Reduced motion keeps immediate underlines and removes spatial hover movement. Command output remains immediate.
