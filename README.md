# Aaron Cassar

A small personal website with a live terminal and a few unnecessary things underneath.

```sh
bun install --frozen-lockfile
bun run dev
```

Open http://localhost:5181. Before deploying, run `bun run lint`, `bun run format:check`, `bun run build`, and `bun run test`. Install the test browser once with `bunx playwright install chromium`.

GitHub Actions deploys the verified `dist/` artifact to [aaroncassar.com](https://aaroncassar.com). See [project notes](docs/README.md) for design decisions and hosting history.
