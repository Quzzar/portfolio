# Impeccable in Quzzar visual work

Use the installed official `impeccable` skill. Its current playbooks own the command details;
this reference defines when Quzzar work uses them. Do not maintain a second copy of upstream
instructions or invoke every command on every edit.

## Start with context

Read the repo's product context, design decisions, and rejected directions. Follow the
installed skill's context-loading step. `PRODUCT.md` holds audience, tasks, and constraints;
`DESIGN.md` and `.impeccable/design.json` capture the visual system. Reuse them rather than
asking the same discovery questions each session. If Impeccable is missing, follow setup's
installation step. A failed installation or launcher is an explicit incomplete check.

Commands below are agent-chat operations: `/impeccable <command> <target>` in Claude Code,
`$impeccable <command> <target>` in Codex. Read the corresponding installed playbook and carry
out its steps through the tools available in the session. Typing a command name in a report
does not run a review. `bunx impeccable detect`, shown below, is a terminal command.

## Design and refine

| Situation | Use Impeccable for |
| --- | --- |
| New surface or substantial redesign | Its new-design workflow; `shape` when planning is the deliverable |
| Several versions of a named element | `generate <count> <action> <element>` for live comparison |
| First rendered implementation or an unclear visual problem | `critique`, including its AI-pattern assessment |
| Weak hierarchy, spacing, or typography | `layout` or `typeset` |
| Clutter or excessive decoration | `distill` or `quieter` |
| Bland composition with room for expression | `bolder`; `delight` for a meaningful signature moment |
| Unclear labels or instructions | `clarify` |
| Responsive layout or difficult states | `adapt` or `harden` |
| Before finishing a visual change | `polish` for craft, then `audit` for implementation quality |

These commands are tools for the current problem, not a checklist of effects to add. A task
interface earns distinction through hierarchy, density, and precise feedback; a marketing
page can give more space to expressive imagery and composition. Keep established product
identity during refinement. Respect the repo's tokens, accessible primitives, architecture,
and existing behavior when applying upstream suggestions.

For every visual change, use critique, polish, and audit on the affected surface, scaled to
the scope of the edit. Fix actionable findings in scope and repeat the affected checks after
changes. Do not turn a small component edit into an unsolicited site redesign.

## Explore multiple directions

Treat “eight versions,” “different directions,” or “give me options” as a request to explore.
Honor the requested count and fidelity: concept sketches, image mockups, and working screens
are different deliverables. A request for working versions needs working versions. Use the
brief to choose useful directions autonomously when the user has invited exploration.

- **For variants of an existing element**, use Impeccable `generate` with the requested count,
  a suitable action, and the named target. For example, `/impeccable generate 8 polish the
  pricing cards` in Claude Code, or `$impeccable generate 8 polish the pricing cards` in Codex.
  The current live workflow supports up to eight variants in one round; check the installed
  playbook for limits and group larger requests without reducing the total.
- **For whole-page concepts or new identities**, use the new-design/shape workflow to develop
  the requested directions. Give each a clear premise grounded in the subject, a composition,
  typographic character, imagery approach, and signature. An exploration of a new identity
  can change those axes; variants inside an established system use the freedom that system
  actually allows.
- **Make the differences legible.** Vary structure, hierarchy, density, image treatment, or
  interaction where the brief permits. Compare the silhouettes before investing in detail;
  eight palette swaps of one layout do not satisfy a request for distinct directions. Keep
  the product facts and task comparable so differences come from design rather than claims.
- **Refine every delivered candidate.** Use `layout`, `typeset`, `bolder`, `quieter`,
  `distill`, or `delight` to strengthen its own premise, then `polish` its execution. Judge
  each against its intended character so refinement does not make them all converge. Use
  `critique` to catch weak or repetitive candidates and replace them before presenting.
- **Make selection easy.** Show the requested alternatives at consistent sizes with concise
  names and the main tradeoff of each. Let the user choose before replacing the final
  surface. Preserve the chosen direction in the design context for subsequent work.

During `generate`/`live`, follow the installed preview and acceptance protocol: the live
overlay is the review channel while temporary variants are mounted. Run final screenshot,
audit, and detector checks after acceptance and cleanup, not against transient variant
wrappers. For independently delivered working versions, verify every candidate. Clean up
preview scaffolding through the supported workflow so it does not become application code.

## Mockups and finished assets

Use a real image-generation tool when the direction benefits from visual exploration or a
specific illustration, photo, texture, or cutout. Prefer the host's built-in image tool and
load its image-generation skill. A mockup is a composition target; controls, text, responsive
layout, and accessibility still need implementation and verification in the running app.

Follow the user's selected build path. When visual ambition matters and image generation is
available, offer Impeccable's mockup-first workflow. Build directly when that fits the task.
Both paths can generate finished assets. Do not create credentials or switch to a separately
billed API merely because the built-in tool is absent or fails; report the constraint and
resolve that choice with the user. See the [image-generation
guide](https://impeccable.style/docs/image-generation/) for current setup details.

## Detect AI patterns and verify the result

Keep supported design hooks active during UI edits unless the user has disabled them. Check
their status when feedback appears absent or setup changed; silence does not prove a clean
scan. Hooks provide early feedback; finish a visual change with an explicit detector pass:

```bash
bunx impeccable detect path/to/changed-ui.tsx path/to/changed-styles.css.ts
bunx impeccable detect http://localhost:5173/changed-route
bunx impeccable detect --viewport 390x844 http://localhost:5173/changed-route
```

Replace example paths, port, and route with the actual files and running surface. For a
shared component use its gallery route. For an authenticated route, use supported session
access and confirm the detector reached the intended screen, not the login page. If it
cannot, report the rendered scan as incomplete and still use the authenticated screenshot
loop to inspect the UI. Scan the changed files for a focused edit; scan the UI source
directory for a broader design pass. Source checks and browser checks cover different issues.

Read the findings and advisories. Exit `0` means no primary findings, `2` means primary
findings, and `1` means a scan failed, including a partial scan. Fix relevant faults or record
a narrow, reasoned exception for an intentional brand choice. Keep unrelated detector rules
enabled. Never blanket-ignore findings just to obtain a clean result.

Review the screenshots against `quzzar-design`'s rubric as well. Look for generic composition,
irrelevant decoration, repetitive cards, weak hierarchy, filler copy, and visual choices that
could belong to any product. Detection finds known patterns; it cannot certify originality,
usability, or accessibility. Trigger real states, use keyboard focus, check both themes when
supported, and re-capture after the final changes.

Report which surface was reviewed, what changed after critique, scan results, and any
unverified state. A visual task is complete when the changed surface has been seen rendered,
the required reviews and scans have run, and findings are resolved or explicitly accounted
for. See the [detector guide](https://impeccable.style/docs/detector/) for current scan options.
