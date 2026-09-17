# Product Brief: `tsc-clean`

> **The `--clean` that `tsc` never shipped.**

`tsc` compiles your files, but it never deletes anything.
Rename `foo.ts` to `foo/index.ts` and `dist/foo.js` and `dist/foo.d.ts` live on forever — confusing your tests, your types, and your teammates. `tsc-clean` reads your `tsconfig.json`, works out exactly which files `tsc` would emit today, and removes the ones it wouldn't.
Nothing else.
Runs once after a build, or alongside `tsc --watch`.

This document captures the naming decision, positioning, and the full feature vision — sequenced into a **v1** that is worth shipping on its own and a **vNEXT** that follows.
For the underlying market research, see [`MARKET_RESEARCH.md`](./MARKET_RESEARCH.md).

---

## Name

### Chosen: `tsc-clean`

```sh
tsc && tsc-clean
```

**Why it wins**

- **It's the community's word.** Across every comment in TypeScript issues [#16057](https://github.com/microsoft/TypeScript/issues/16057), [#61056](https://github.com/microsoft/TypeScript/issues/61056), [#36648](https://github.com/microsoft/TypeScript/issues/36648), [#43193](https://github.com/microsoft/TypeScript/issues/43193) and [#30602](https://github.com/microsoft/TypeScript/issues/30602) (~48k characters of discussion), people say `delete` 93×, `clean` 70×, `remove` 29×, and ask for a `--clean` flag 26×. `prune`, `sweep`, `tidy`, `purge` and `orphan` appear **zero** times.
  Two of the issue titles literally read _"Cleaning Target Files"_ and _"doesn't clean files from output folder"_.
- **It reads as the missing flag.** `tsc && tsc-clean` ≈ "the `--clean` that `tsc` never shipped".
  The TypeScript team closed the request as out of scope, so the slot stays open indefinitely.
- **It's a compiler companion.** The `tsc-*` prefix places it next to `tsc-watch` (~3M downloads/month) and `tsc-alias` — tools people already reach for right after `tsc`.

**Availability** (verified against `registry.npmjs.org`)

| Name                                                                        | Status                                     | Notes                                                                                                              |
| :-------------------------------------------------------------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `tsc-clean`                                                                 | ✅ **Free** (404)                          | Not blocked by npm's punctuation-only "moniker" rule — it differs from `ts-clean` by a letter, not by punctuation. |
| `tsc-reap`                                                                  | ✅ Free — **reserved as fallback / alias** | Memorable and playful; no vocabulary match, so it stays the backup.                                                |
| `tsc-cleanup`                                                               | ✅ Free                                    | Optional: publish as a deprecated pointer to `tsc-clean` to catch typos.                                           |
| `ts-clean`                                                                  | ❌ Taken                                   | 915 dl/mo, abandoned Dec 2019.                                                                                     |
| `tsc-clear`                                                                 | ❌ Taken                                   | 19 dl/mo, Windows-only Rust CLI.                                                                                   |
| `tsc-cleaner`                                                               | ❌ Taken                                   | 4 dl/mo, generic rimraf wrapper at v0.0.3.                                                                         |
| `ts-cleaner`, `ts-prune`, `ts-purify`, `ts-clean-built`, `broom`, `dustoff` | ❌ Taken                                   | Avoid.                                                                                                             |
| `tsclean`, `tsprune`                                                        | ⛔ Rejected by npm                         | Collide with `ts-clean` / `ts-prune` under the moniker rule.                                                       |

The neighbours are dead or negligible, so `tsc-clean` inherits the obvious search terms without inheriting anyone's confusion.

**Rejected alternatives**

| Candidate               | Why not                                                                                         |
| :---------------------- | :---------------------------------------------------------------------------------------------- |
| `tsc-prune`             | Too close to `ts-prune`, a popular unused-_exports_ tool — a different job with a big audience. |
| `dist-prune`            | Assumes `dist` as `outDir`; shares "prune" with `ts-prune`.                                     |
| `outdir-prune`          | Precise for TypeScript users, but awkward to say and type.                                      |
| `tsc-sweep`, `tsc-tidy` | Nice and collision-free, but zero vocabulary match with the people who have the problem.        |

---

## Positioning

### Tagline

1. **"The `--clean` that `tsc` never shipped."** ← recommended
2. "Your source moved on.
   Let your `outDir` do the same."
3. "Deletes what `tsc` forgot to."
4. "Keep `outDir` honest."

### npm `description` (one line)

> Remove stale build output that `tsc` leaves behind when you delete or rename source files. tsconfig-aware, safe by default.

### Elevator paragraph (README intro)

> `tsc` compiles your files, but it never deletes anything.
> Rename `foo.ts` to `foo/index.ts` and `dist/foo.js` and `dist/foo.d.ts` live on forever — confusing your tests, your types, and your teammates. `tsc-clean` reads your `tsconfig.json`, works out exactly which files `tsc` would emit today, and removes the ones it wouldn't.
> Nothing else.
> Runs once after a build, or alongside `tsc --watch`.

### Tone

Friendly and a little playful, in the spirit of the Jest and Vitest READMEs — but always polite, inclusive, and precise about what the tool does and doesn't do.
A cleanup tool earns trust by being clear, not clever.

---

## Key Features

The list below is the whole picture, split into what a first release has to do to be worth installing (**v1**) and what makes it the obvious choice afterwards (**vNEXT**).
Nothing here is dropped — it's just sequenced, so something useful ships sooner.

### v1 promise

| #   | Feature                              | One-liner                                                                                                                                                                                                                 |
| :-- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Zero-config `tsconfig` awareness** | Resolves `outDir`, `rootDir`, `declarationDir`, `include`/`exclude`/`files`, `extends`, `allowJs`, `emitDeclarationOnly`, `noEmit` — via the TypeScript API, so it agrees with `tsc` by construction.                     |
| 2   | **Knows every emit**                 | `.ts/.tsx/.mts/.cts` (+ `.js/.jsx` with `allowJs`) → `.js/.mjs/.cjs`, `.d.ts/.d.mts/.d.cts`, `.js.map`, `.d.ts.map`.                                                                                                      |
| 3   | **Handles incremental builds**       | Leaves `.tsbuildinfo` alone so incremental builds stay fast.                                                                                                                                                              |
| 4   | **Safe by default**                  | Deletes only files it can prove `tsc` would have emitted from a now-missing source; never touches paths outside `outDir`; `--dry-run` shows the plan; unknown files (assets, copied JSON) are left alone unless opted in. |
| 5   | **Tidies up after itself**           | Removes directories left empty by the cleanup.                                                                                                                                                                            |

### vNEXT promise

| #                                     | Feature                            | One-liner                                                                                                                                                                                  |
| :------------------------------------ | :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6                                     | **Watch mode**                     | `tsc-clean --watch` runs next to `tsc --watch` (or `concurrently` / `tsc-watch --onSuccess` / `tsc-clean -- ...` or script-friendly way), and survives rename/move storms with debouncing. |
| 7                                     | **Project references & monorepos** | `tsc-clean -b` follows `references`/`composite` like `tsc -b`, cleaning every referenced project's `outDir`.                                                                               |
| 8                                     | **Boring where it matters**        | Cross-platform (Linux/macOS/Windows), Node LTS, tiny dependency footprint, MIT.                                                                                                            |
| Cross-tested with different versions. |
| 9                                     | **Fast**                           | Optimized for large codebases, huge amount of files                                                                                                                                        |
| 10                                    | **Programmatic API**               | `clean()`, `plan()`, `watch()` for custom build scripts and plugins — exposed once the internals are stable enough to promise.                                                             |

---

## CLI Sketch

```sh
tsc && tsc-clean                 # one-shot, uses ./tsconfig.json
tsc-clean --dry-run              # show what would go, delete nothing
tsc-clean -p tsconfig.build.json # pick a config
tsc-clean -b                     # follow project references
tsc-clean --watch                # companion to tsc --watch
tsc-clean --verbose              # list every removed file
```

Typical `package.json` wiring:

```json
{
	"scripts": {
		"build": "tsc && tsc-clean",
		"dev": "concurrently \"tsc --watch\" \"tsc-clean --watch\""
	}
}
```

---

## Non-goals

State these up front so nobody is surprised:

- **Not a `rimraf` replacement.** It never wipes `outDir` wholesale; if you want a clean slate, `rimraf` is one line away.
- **Does not detect unused _source_ code.** That's the job of `knip` / `ts-prune`.
- **Not a bundler.** If you use tsup, Vite or esbuild, they already clean up after themselves — you probably don't need this.

---

## Publishing Checklist

- [ ] Reserve npm package `tsc-clean` (placeholder `0.0.0` with this README's intro and a "coming soon" note).
- [ ] Reserve npm package `tsc-reap` (fallback / alias).
- [ ] Reserve GitHub repository `tsc-clean`.
- [ ] _Optional:_ publish `tsc-cleanup` as a deprecated pointer to `tsc-clean` to catch typos.
- [ ] Add `keywords` in `package.json`: `tsc`, `typescript`, `clean`, `outDir`, `dist`, `stale`, `orphan`, `build`, `watch`.
- [ ] Post a short note in TypeScript issue #16057 once v1 ships — that thread is where the audience already gathers.
