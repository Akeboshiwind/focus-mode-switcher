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
- **Before each commit**: `npm test`, `npm run typecheck`, `npm run build` and `sd validate` pass. The `check` workflow runs the same on every branch push.
- **Push the branch as commits land.**
- **The branch lands as a PR** opening `Resolves #<issue>`, merged with a merge commit.
- **Once merged**, delete the local worktree and branch; the remote branch is deleted on merge.
- **Chores with no issue** (the scaffold, tooling bumps) MAY go straight to `main`.

## Releasing

**After landing on `main`, tag it and push the tag**; the `release` workflow packs the plugin and publishes it as a GitHub Release.

- **The tag is the version.** `manifest.json`'s `Version` is never bumped by hand; the workflow passes the tag to `sd pack --version`.
- **Bump from the latest `v*` tag by what landed**, per Conventional Commits:
  - a breaking change → major;
  - any `feat` → minor;
  - any `fix` → patch;
  - only `docs`, `chore`, `ci`, `tidy`, `refactor` or `test` → no tag.
- **Tag the merge commit and push it**: `git tag vX.Y.Z && git push origin vX.Y.Z`. Only plain `vX.Y.Z` triggers a release.
