# A quiet page with a secret terminal

The user approved mockup 3, `.impeccable/mocks/terminal-seed.png`: compact personal introduction, visible prompt, generous whitespace, and utility links at the bottom. They subsequently replaced the old software-engineer subtitle with three independent changing words, starting as founder, engineer, designer.

The word transition follows Prebreak’s `packages/project-intake/src/IntakeOpeningHeading.tsx`: fixed-height clipped lines and vertically sliding words. This page uses independent centered columns, randomly rescheduled 3–6 second delays, offscreen/hidden-page pausing, and a still reduced-motion version. The accessible identity stays “Founder, engineer, designer.”

Fira Code is self-hosted. It was the closest monospace face in the measured comparison against the comp. Light paper, blue-black ink, and steel secondary text keep the page quiet. The prompt is an xterm.js terminal emulator with a block cursor, text selection, scrollback, and a local-echo shell controller. No visible HTML input or ghost-completion row remains.

The work/about/contact navigation row is removed. Visitors type commands. Tab completes command names and filenames and prints ambiguous matches inside the terminal, preserving the current line. Arrow keys edit and recall history; Home/End and Ctrl-A/E move the cursor; Ctrl-C cancels a line; Ctrl-L clears; Escape leaves terminal focus. Enter runs the command. Output, including project URLs, is rendered by xterm, with the web-links addon handling destinations. The browser-only command vocabulary remains allowlisted. The emulator is loaded as a separate chunk and fits its column count and viewport to the screen. The viewport grows with output up to a bounded height, then uses terminal scrollback.

`ls -a` reveals `./play`: an interactive monochrome ASCII wave surface. Pointer movement reshapes the field; a press makes a ripple. Back and Escape restore the terminal transcript and focus. A pause control and still reduced-motion path preserve control.

The user removed the identity pause control and requested centered words. Footer links read GitHub, Resume, LinkedIn. Both the theme button and theme command reveal the already-rendered opposite theme through randomly ordered short brush daubs over 1600ms. Each patch has its own position, angle, bristled edge, and curved slather. Strokes cover fractions of the viewport rather than sweeping across its full width. Native view snapshots expose text, controls, and background together, with no separate UI fade. The icon rotates and settles during the change. Reduced motion and browsers without view transitions switch immediately.

The project constellation was rejected in favor of the secret terminal. Centered calling-card and offset-note compositions were not selected. Avoid reintroducing them in later refinements.

Reference observations: Mobbin’s Locomotive hero separates utility links from the focal content; that separation informed the footer. The Aino and Metalab previews were blank and supplied no visual evidence. The approved image, followed by the user’s identity correction, is the visual authority.

All columns draw from a shared nine-word pool. Each independently chooses a new 3–6 second delay after every change and selects a random word absent from all current columns and departing animations. Equal-width tracks accommodate the longest word in every column.
