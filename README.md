<h1 align="center">tsc-clean</h1>

<p align="center">
	Remove stale build output that tsc leaves behind when you delete or rename source files.
	Tsconfig-aware. Just run <code>tsc &amp;&amp; tsc-clean</code>.
	🧹
</p>

<p align="center">
	<!-- prettier-ignore-start -->
	<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
	<a href="#contributors" target="_blank"><img alt="👪 All Contributors: 1" src="https://img.shields.io/badge/%F0%9F%91%AA_all_contributors-1-21bb42.svg" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
	<!-- prettier-ignore-end -->
	<a href="https://github.com/michal-kocarek/tsc-clean/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://codecov.io/gh/michal-kocarek/tsc-clean" target="_blank"><img alt="🧪 Coverage" src="https://img.shields.io/codecov/c/github/michal-kocarek/tsc-clean?label=%F0%9F%A7%AA%20coverage" /></a>
	<a href="https://github.com/michal-kocarek/tsc-clean/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg" /></a>
	<a href="http://npmjs.com/package/tsc-clean" target="_blank"><img alt="📦 npm version" src="https://img.shields.io/npm/v/tsc-clean?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

## Usage

> [!WARNING]
> The CLI is an unreleased prototype.
> Do not rely on it for builds yet.

```sh
tsc && tsc-clean
```

The planned cleaner treats `outDir` as dedicated to TypeScript.
It may remove any regular file there that TypeScript would not emit from the current project, including copied assets.
If your build copies assets into `dist`, run cleanup before the copy step (for example, `tsc && tsc-clean && cp assets/* dist/assets/`) or use a separate directory.
An `--exclude` option may be added later.

See [`PRODUCT.md`](./PRODUCT.md) for the planned CLI and feature set, and [`MARKET_RESEARCH.md`](./MARKET_RESEARCH.md) for the research behind it.

## Development

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md), then [`.github/DEVELOPMENT.md`](./.github/DEVELOPMENT.md).
For publishing, see [`RELEASING.md`](./RELEASING.md).
Thanks! 🧹

## Contributors

<!-- spellchecker: disable -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/michal-kocarek"><img src="https://avatars.githubusercontent.com/u/762095?v=4?s=100" width="100px;" alt="Michal Kočárek"/><br /><sub><b>Michal Kočárek</b></sub></a><br /><a href="https://github.com/michal-kocarek/tsc-clean/commits?author=michal-kocarek" title="Code">💻</a> <a href="#content-michal-kocarek" title="Content">🖋</a> <a href="https://github.com/michal-kocarek/tsc-clean/commits?author=michal-kocarek" title="Documentation">📖</a> <a href="#ideas-michal-kocarek" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-michal-kocarek" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-michal-kocarek" title="Maintenance">🚧</a> <a href="#projectManagement-michal-kocarek" title="Project Management">📆</a> <a href="#tool-michal-kocarek" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- spellchecker: enable -->
