# Terminal behavior

xterm.js owns the visible terminal, selection, block cursor, scrollback, and accessibility tree. xterm-readline owns incremental input, editing, and history. The browser-only command resolver supplies site responses.

`terminal-completion.ts` selects the command or filename token at the caret. A unique match completes with a trailing space. Ambiguous completion lists the available matches without modifying the typed token. The next Tab selects the first match; further Tab/Shift-Tab cycles through the original match set and wraps at either end. Unique matches still complete immediately. New input or cursor movement discards that set. Unknown prefixes remain unchanged.

The idle terminal contains only the prompt, with no greeting or persistent keyboard instructions. Help lists command names only; other output is factual text, file names, or URLs, without greetings or interaction instructions. The legacy `hello` and `hi` commands return help.

The centered content area is up to 56rem wide, giving the desktop terminal roughly 80 columns. The page occupies `100dvh` with a compact top inset. The terminal flexes into the available height between the introduction and footer, with no fixed minimum height forcing page overflow. Output scrolls inside the terminal. Identity words keep animating after commands produce output. Typing never changes its size or the main column’s position. Fit runs only after a real size/font change. Navigation key defaults are cancelled so Home/End and arrows edit the terminal without moving the document.

`patches/xterm-readline@1.3.1.patch` adds a typed cursor getter, cursor-preserving line replacement, a completion-list method, a prompt-ready barrier, and draft restoration when returning from history. This small API patch keeps prompt reanchoring inside the readline implementation rather than reaching into its private state from React. Bun applies it during frozen installs. Reassess the patch when upgrading the pinned addon.

Regression coverage checks every sampled animation frame for the persistent prompt, unchanged geometry while typing/editing, forward/reverse cycling, completion before trailing arguments, Mac editing keys, interruption, clearing, mobile resize, and preservation across theme changes.

`clear` and `exit` queue an erase-display, erase-scrollback, and cursor-home sequence before the next prompt. Do not call synchronous `term.reset()` here: pending input redraws can repaint the submitted command after the reset. Command history remains available through the arrow keys.
