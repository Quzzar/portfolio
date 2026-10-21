<!-- quzzar-skills:start -->
## Agent skills

**Before starting any work in this repo, read the `quzzar-workplace` skill.** It holds the
conventions for issues, branches, commits, PRs, and review, plus the code rules that apply
at every layer: naming, file organization, comments, types, error handling, dependencies.

Then, before writing code, read the skill for the layer you're touching:

- **`quzzar-frontend`**: UI, components, styling, client state, data fetching, forms,
  accessibility, frontend tests.
- **`quzzar-backend`**: API routes, server code, database queries, migrations, validation,
  auth, background jobs, backend tests.

Read the layer skill *before* writing, not as a check afterwards. A change spanning both
layers needs both.

For visual work, also read **`quzzar-design`** and the installed **`impeccable`** skill.
Follow their reference research, design, critique, refinement, and detector workflow.
Never report a visual change as done without having looked at it rendered.

### Stack

<!-- filled in by /setup from the repo itself. Correct it by hand if it drifts -->

- Languages / toolchains: Strict TypeScript, React, Vite, vanilla-extract.
- Package manager: Bun; bun.lock.
- Frontend: `bun run dev`, port 5181; production preview on 4173. Port 5173 belongs to another local project.
- Backend / runtime: Static GitHub Pages hosting; custom domain aaroncassar.com.
- Test: `bun run test` (Playwright against the production build; install Chromium first).
- Typecheck and build: `bun run build`.
- Lint and format: `bun run lint`, `bun run format:check`.
<!-- quzzar-skills:end -->

Quzzar and Impeccable skills are installed under `.agents/skills/`.

Before continuing the redesign, read `PRODUCT.md`, `docs/design-direction.md`, and `docs/hosting.md`.
The user approved mockup 3 and then requested independently changing founder / engineer / designer columns.
The original constellation proposal was rejected. The prompt is functional, with an allowlisted command resolver; keep it browser-only.
