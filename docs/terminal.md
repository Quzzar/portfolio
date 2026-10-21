# Terminal behavior

xterm.js owns the visible terminal, selection, block cursor, scrollback, and accessibility tree. xterm-readline owns incremental input, editing, and history. The browser-only command resolver supplies site responses.

`terminal-completion.ts` selects the command or filename token at the caret. A unique match completes with a trailing space. Ambiguous completion first expands the shared prefix if possible. Another Tab lists matches without selecting one; further Tab/Shift-Tab selects from the original match set. When the prefix cannot expand, the first Tab lists matches. This sequence was checked directly in the Mac’s configured interactive zsh (`expand-or-complete`). New input or cursor movement discards that set. Unknown prefixes remain unchanged.

The idle terminal contains only the prompt, with no greeting or persistent keyboard instructions. The legacy `hello` and `hi` commands return help.

The viewport stays at `clamp(14rem, 32svh, 22rem)`. Typing never changes its size or the main column’s position. Fit runs only after a real size/font change. Navigation key defaults are cancelled so Home/End and arrows edit the terminal without moving the document.

`patches/xterm-readline@1.3.1.patch` adds a typed cursor getter, cursor-preserving line replacement, a completion-list method, a prompt-ready barrier, and draft restoration when returning from history. This small API patch keeps prompt reanchoring inside the readline implementation rather than reaching into its private state from React. Bun applies it during frozen installs. Reassess the patch when upgrading the pinned addon.

Regression coverage checks every sampled animation frame for the persistent prompt, unchanged geometry while typing/editing, forward/reverse cycling, completion before trailing arguments, Mac editing keys, interruption, clearing, mobile resize, and preservation across theme changes.
