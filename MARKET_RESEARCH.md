# Market Research: TypeScript Build Output Cleanup Tools

## Executive Summary

When developing in TypeScript with `tsc` or `tsc --watch`, deleting, renaming, or refactoring source files leaves orphaned compilation artifacts (`.js`, `.d.ts`, `.js.map`, `.d.ts.map`) in the build output directory (`outDir` / `dist`). 

This causes serious developer friction:
- Phantom / ghost type declarations causing subtle type-checking and autocompletion bugs.
- Test runners (e.g. Jest, Vitest, Mocha) executing orphaned test bundles in `dist/`.
- Runtime import errors when converting modules (e.g., `foo.ts` -> `foo/index.ts`).
- Developers forced to run full nukes (`rimraf dist && tsc`), eliminating the performance advantages of incremental builds and `tsc --watch`.

This document synthesizes ecosystem research, community demand on GitHub, the official TypeScript team stance, and product opportunities for a modern TypeScript cleanup tool (`tsc-clean` — see [`PRODUCT.md`](./PRODUCT.md) for the product brief).

---

## TypeScript Core Team Stance & GitHub Demand

### Community Demand
The issue of stale emit files in `tsc` has been documented and actively discussed for nearly a decade:
- **[#16057](https://github.com/microsoft/TypeScript/issues/16057) (*"Typescript Watch - Cleaning Target Files on Source Deletion"*):** Opened in May 2017 with **150+ upvotes (`+1`)** and consistent community activity spanning 2017–2025+.
- **[#61056](https://github.com/microsoft/TypeScript/issues/61056):** *"Tsc does not behave correctly when files are moved or deleted"*
- **[#36648](https://github.com/microsoft/TypeScript/issues/36648):** *"`tsc --incremental` doesn't clean files from output folder"*
- **[#43193](https://github.com/microsoft/TypeScript/issues/43193):** *"Allow prepending `--watch` with `--clean` in CLI `--build` mode"*
- **[#30602](https://github.com/microsoft/TypeScript/issues/30602) / [#13722](https://github.com/microsoft/TypeScript/issues/13722):** Incremental builds and deleted generated files.

### Official Core Team Stance
The TypeScript team (Ryan Cavanaugh, Jake Bailey, Sheetal Kamat) has repeatedly declined PRs and closed feature requests as **`not_planned`** or **`Out of Scope`**.

Key reasons provided by the TypeScript maintainers:
1. **Strict File-Deletion Conservatism:** The compiler avoids destructive filesystem operations. The core team's philosophy is: *"We're intentionally extremely conservative (as in, 'don't') about deleting files... outputs not version-controlled -> `git clean` or `rimraf` should be sufficient."*
2. **Ambiguity in `outDir`:** `tsc` cannot reliably distinguish files it generated from assets, vendor scripts, or files written by other build steps.
3. **`tsc --watch` Architectural Constraints:** Incremental builders maintain diff-based programs; cross-session and cross-process output tracking introduces significant compiler complexity and performance overhead.
4. **Behavioral Parity:** `tsc --watch` is designed to emulate looping `tsc`; special-casing file deletions only in watch mode violates compiler design consistency.

**Takeaway:** There is zero risk of this functionality being built into `tsc` in the foreseeable future. The opportunity space is stable.

---

## Existing Tools & Competitive Landscape

Several micro-tools were created over the years, many announced directly within TypeScript issue #16057:

| Tool | Status / Last Update | Stars / Downloads | Limitations & Gaps |
| :--- | :--- | :--- | :--- |
| **`ts-cleaner`** (`TarVK/ts-cleaner`) | v1.0.5 (Dec 2019) | 12 stars, ~7k/mo | Unmaintained; crashes if `dist` missing; no `tsconfig.json` resolution (`rootDir`/`outDir`). |
| **`ts-purify`** (`insidewhy/ts-purify`) | v3.0.5 (Nov 2021) | ~1.5k/mo | Built to fix `ts-cleaner` bugs, but requires external system dependency (`fb-watchman`). Abandoned. |
| **`ts-clean-built`** (`whitecolor/ts-clean-built`) | v1.3.1 (May 2022) | 10 stars | CLI to clean outdated outputs; lacks active maintenance and monorepo awareness. |
| **`typemon`** (`crestanzio/typemon`) | v2.0.0 (Feb 2021) | 3 stars | Custom file watcher for rename/delete events to run parallel with `tsc --watch`. Unmaintained. |
| **`tsc-clear`** (`SignorMassimo/tsc-clear`) | Jul 2025 | 19 dl/mo | Written in Rust, reads `tsconfig.json`, but **Windows-only** and zero market adoption. |
| **`ts-clean`** (`koa-next/ts-clean`) | Dec 2019 | 3 stars, 16 issues | Abandoned prototype. |
| **`tsc-cleaner`** | v0.0.3 | 4 dl/mo | Generic rimraf-style wrapper; not `tsconfig`-aware, no selective pruning. |
| **`@dobesv/clean-dest`** | May 2025 | 0 stars | Generic directory mirror/cleaner; not TypeScript or `tsconfig`-aware. |

*(Note: Tools like `knip` or `ts-prune` identify unused **source** code, not orphaned **build** outputs).*

---

## Common Workarounds & Why They Fall Short

1. **`rimraf dist && tsc` / `del-cli dist && tsc`**
   - *Drawback:* Completely blows away `.tsbuildinfo` and compiler caches, forcing slow full re-compilations on every cycle.
2. **`tsc --build --clean`**
   - *Drawback:* Deletes *all* outputs across project references, not just orphaned files. Not hookable into standard `tsc --watch` workflows.
3. **Bundlers (esbuild, Vite, tsup, unbuild)**
   - *Drawback:* Bundlers solve this for bundled applications, but libraries, Node.js microservices, and monorepos emitting declaration files (`.d.ts`) often need pure `tsc` emits.
4. **Task Runners / Build Orchestrators (e.g. Google `wireit`)**
   - *Drawback:* Heavyweight build system overhead when all the developer wants is a lightweight companion to `tsc`.
5. **DIY Watch Scripts (`chokidar-cli`, `onchange`)**
   - *Drawback:* Fragile bash one-liners, high CPU usage, race conditions on rapid file rename/move operations.

---

## Market Opportunity & Key Differentiators

Past tools failed because they were single-author, one-off scripts that lacked deep TypeScript configuration awareness, safety guards, and ongoing maintenance.

### Key Differentiators for a Winning Tool:
1. **Native `tsconfig.json` Resolution:**
   - Automatically parse `outDir`, `rootDir`, `declarationDir`, `emitDeclarationOnly`, `allowJs`, `include`, `exclude`, and `extends`.
   - No manual globbing or path flags required for 95% of standard projects.
2. **Comprehensive Output Mapping:**
   - Maps `.ts` / `.tsx` / `.mts` / `.cts` / `.js` to their corresponding `.js`, `.mjs`, `.cjs`, `.d.ts`, `.d.mts`, `.d.cts`, `.js.map`, `.d.ts.map` artifacts.
   - Automatically removes now-empty output directories.
3. **Monorepo & Composite Project Support:**
   - Understand `composite: true`, `references` (`tsconfig.json`), and multi-package layouts.
4. **Safety-First Architecture:**
   - `--dry-run` flag showing exactly what would be removed.
   - Strict containment: refuse to operate outside verified `outDir` directories to prevent accidental data loss.
   - Respect `.gitignore` and ignore non-TypeScript assets unless configured.
5. **Seamless Execution Modes:**
   - **One-shot CLI:** Run post-build (`tsc && tsc-clean`).
   - **Watch Mode Companion:** Lightweight watcher (using modern fs events) that operates alongside `tsc --watch` without crashing on file churn.
   - **Programmatic Node.js API:** For integration into custom build scripts.

---

## Naming Research

The final decision (`tsc-clean`, with `tsc-reap` reserved as a fallback) and its rationale live in [`PRODUCT.md`](./PRODUCT.md). This appendix preserves the raw research behind it.

### What the community calls the action

Word counts across all comments in TypeScript issues #16057, #61056, #36648, #43193 and #30602 (~48k characters of discussion):

| Word | Occurrences |
| :--- | ---: |
| `delete` | 93 |
| `clean` | 70 |
| `remove` | 29 |
| `--clean` (as a requested flag) | 26 |
| `sync` | 8 |
| `rimraf` | 6 |
| `stale` | 2 |
| `prune` / `sweep` / `tidy` / `purge` / `orphan` | 0 |

Issue titles themselves use the same vocabulary: *"Cleaning Target Files on Source Deletion"* (#16057) and *"doesn't clean files from output folder"* (#36648). `clean` is unambiguously the community's word, and `--clean` is the flag people ask `tsc` for.

### npm availability (checked against `registry.npmjs.org`)

| Candidate | Status | Notes |
| :--- | :--- | :--- |
| `tsc-clean` | ✅ Free | **Chosen.** Differs from `ts-clean` by a letter, not punctuation, so it passes npm's moniker rule. |
| `tsc-reap` | ✅ Free | **Reserved** as fallback / alias. |
| `tsc-cleanup` | ✅ Free | Candidate for a deprecated pointer to `tsc-clean`. |
| `tsc-sweep`, `tsc-tidy`, `tsc-gc`, `tsc-stale`, `tsc-janitor`, `tsc-broom`, `tsc-scrub`, `tsc-purge`, `tsc-vacuum`, `tsc-orphans` | ✅ Free | Rejected: zero vocabulary match with the issue threads. |
| `tsc-prune` | ✅ Free | Rejected: too close to `ts-prune` (popular unused-exports tool). |
| `dist-prune`, `dist-sweep`, `tidy-dist` | ✅ Free | Rejected: assume `dist` as `outDir`. |
| `outdir-prune`, `emit-prune`, `prune-emit`, `stale-emit` | ✅ Free | Rejected: precise but awkward, no `tsc` association. |
| `tsweep`, `tscrub`, `tsbroom`, `orphaned` | ✅ Free | Rejected: brandable but not self-explanatory in a scripts list. |
| `ts-cleaner` | ❌ Taken | `TarVK/ts-cleaner`, ~7k dl/mo, unmaintained since 2019. |
| `ts-clean` | ❌ Taken | `koa-next/ts-clean`, 915 dl/mo, abandoned Dec 2019. |
| `tsc-clear` | ❌ Taken | Windows-only Rust CLI, 19 dl/mo. |
| `tsc-cleaner` | ❌ Taken | Generic rimraf wrapper, v0.0.3, 4 dl/mo. |
| `ts-prune`, `ts-purify`, `ts-clean-built`, `typemon`, `broom`, `dustoff` | ❌ Taken | — |
| `tsclean`, `tsprune` | ⛔ Blocked by npm | The registry rejects names that differ from an existing package only by punctuation or case (`tsclean` → `ts-clean`, `tsprune` → `ts-prune`). |

**Note on npm's moniker rule:** npm refuses new package names that are "too similar" to existing ones when the difference is only punctuation (`-`, `.`, `_`) or case. Differences in letters are allowed, which is why `tsc-clean` is publishable despite `ts-clean` existing, while `tsclean` is not.
