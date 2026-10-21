# Hosting

## Diagnosis: 2026-10-21

Git commit 181f9bd deleted the 620-line index.html. GitHub Pages remained enabled on main at / with legacy Jekyll builds and the CNAME aaroncassar.com. The domain resolves through Cloudflare and returns HTTP 200, but Jekyll renders README.md as the homepage. This is a content/deployment failure rather than a missing DNS record.

The transcribed domain aarontasar.com does not resolve. Repository history and the Pages API both identify aaroncassar.com as the intended domain.

## Deployment

The immediate repair restored the original homepage to main in commit 7c6e5eeb. The GitHub Pages build succeeded and the live homepage was visually verified before the redesign.

The replacement uses Bun, strict TypeScript, React, Vite, and vanilla-extract. `.github/workflows/pages.yml` runs lint, formatting, type checks, the production build, and Playwright tests before uploading only dist/ and deploying through GitHub Pages Actions. public/CNAME preserves the custom domain in the built artifact. Pages must use the Actions build source; the repository source is not a deployable Vite artifact.

Local commands: `bun install --frozen-lockfile`, `bun run dev` (port 5181), `bun run lint`, `bun run format:check`, `bun run build`, `bun run test`. Playwright needs `bunx playwright install chromium` once per machine. Tests use the production preview on port 4173. Port 5173 belongs to another local project, so it must not be reused or its process stopped.

Check both HTML and its referenced assets after deployment. HTTP 200 alone did not detect the original failure. The tests assert the real homepage title and content, asset responses, résumé, terminal navigation, command errors and escaping, unique completion, history, clear, themes, hidden-playground return, independent word changes, reduced motion, and mobile overflow.
