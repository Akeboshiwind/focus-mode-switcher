# Focus Mode Switcher

Stream Deck plugin (Node, `@elgato/streamdeck`) that shows and switches macOS Focus modes.

## Commands

```bash
npm ci                # in a new worktree; never symlink another checkout's node_modules
npm test              # unit tests
npm run typecheck     # the build doesn't fail on type errors
npm run build         # bundle to *.sdPlugin/bin
npx sd validate rocks.bythe.focus-mode-switcher.sdPlugin
```

## Landing work

Most changes are a **show**: they merge without waiting for review.

- **One branch per issue**, `worktree-<issue>-<slug>`, off `main`.
- **Tidies and advances are separate commits on that branch**, Conventional Commits, subject suffixed `(#<issue>)`.
- **Before each commit**: `npm test`, `npm run typecheck`, `npm run build` and `sd validate` pass.
- **Push the branch as commits land.**
- **The branch lands as a PR** opening `Resolves #<issue>`, merged with a merge commit.
- **Once merged**, delete the local worktree and branch; the remote branch is deleted on merge.
- **Chores with no issue** (the scaffold, tooling bumps) MAY go straight to `main`.
