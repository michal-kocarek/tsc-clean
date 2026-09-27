import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import { configs as eslintConfigs } from "@eslint/js";
import markdown from "@eslint/markdown";
import vitest from "@vitest/eslint-plugin";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { importX } from "eslint-plugin-import-x";
import { configs as jsdocConfigs } from "eslint-plugin-jsdoc";
import { configs as jsoncConfigs } from "eslint-plugin-jsonc";
import n from "eslint-plugin-n";
import { configs as packageJsonConfigs } from "eslint-plugin-package-json";
import { configs as perfectionistConfigs } from "eslint-plugin-perfectionist";
import { configs as regexpConfigs } from "eslint-plugin-regexp";
import { configs as ymlConfigs } from "eslint-plugin-yml";
import { defineConfig, globalIgnores, includeIgnoreFile } from "eslint/config";
import { fileURLToPath } from "node:url";
import { configs as tsEslintConfigs } from "typescript-eslint";

const TEST_FILES_GLOB = "**/__tests__/**.{js,ts}";
const CONFIG_FILES_GLOB = "*.config.{js,ts}";
const TSCONFIG_GLOB = "**/tsconfig*.json";
const ALL_CODE_GLOB = ["**/*.{js,ts}", "bin/*"];

export default defineConfig(
	includeIgnoreFile(fileURLToPath(new URL(".gitignore", import.meta.url)), {
		name: "Global imported ignores",
	}),
	globalIgnores(
		["src/**/__tests__/fixtures", "pnpm-lock.yaml"],
		"Additional global ignores",
	),
	{
		linterOptions: {
			reportUnusedDisableDirectives: "error",
			reportUnusedInlineConfigs: "error",
		},
		name: "Global settings",
	},
	{
		extends: [
			comments.recommended,
			eslintConfigs.recommended,
			jsdocConfigs["flat/contents-typescript-error"],
			jsdocConfigs["flat/logical-typescript-error"],
			jsdocConfigs["flat/stylistic-typescript-error"],
			{
				...n.configs["flat/all"],
				rules: {
					...n.configs["flat/all"].rules,
					"n/no-hide-core-modules": "off", // Deprecated rule
					"n/shebang": "off", // Deprecated rule
				},
			},
			perfectionistConfigs["recommended-natural"],
			regexpConfigs["flat/all"],
			tsEslintConfigs.strictTypeChecked,
			tsEslintConfigs.stylisticTypeChecked,
			importX.flatConfigs.recommended,
			importX.flatConfigs.typescript,
		],
		files: [...ALL_CODE_GLOB],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: [],
				},
			},
		},
		name: "All source code",
		rules: {
			"@typescript-eslint/strict-boolean-expressions": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			eqeqeq: "error",
			"import-x/default": "off",
			"import-x/namespace": "off",
			"import-x/no-extraneous-dependencies": [
				"error",
				{
					devDependencies: [TEST_FILES_GLOB, CONFIG_FILES_GLOB],
					includeTypes: true,
				},
			],
			"import-x/no-named-as-default": "off",
			"import-x/no-named-as-default-member": "off",
			"logical-assignment-operators": [
				"error",
				"always",
				{ enforceForIfStatements: true },
			],
			"n/no-sync": "off",
			"no-console": "error",
			"no-shadow": "error",
			"no-useless-rename": "error",
			"object-shorthand": "error",
			"operator-assignment": "error",
		},
		settings: {
			"import-x/resolver-next": [createTypeScriptImportResolver()],
			perfectionist: { partitionByComment: true, type: "natural" },
		},
	},
	{
		files: [...ALL_CODE_GLOB],
		ignores: ["**/__tests__/**"],
		name: "Non-dev source code",
		rules: {
			"import-x/no-restricted-paths": [
				"error",
				{
					zones: [
						{
							from: "**/__tests__/**",
							message: "Files outside __tests__ cannot import test files.",
							target: ".",
						},
					],
				},
			],
		},
	},
	{
		extends: [jsoncConfigs["flat/recommended-with-json"]],
		files: ["**/*.json"],
		ignores: [TSCONFIG_GLOB],
		name: "JSON files",
	},
	{
		extends: [jsoncConfigs["flat/recommended-with-jsonc"]],
		files: ["**/*.jsonc", TSCONFIG_GLOB],
		name: "JSONC files",
	},
	{
		extends: [markdown.configs.recommended],
		files: ["**/*.md"],
		name: "Markdown files",
		rules: {
			// https://github.com/eslint/markdown/issues/294
			"markdown/no-missing-label-refs": "off",
		},
	},
	{
		extends: [tsEslintConfigs.disableTypeChecked],
		files: ["**/*.md/*.ts"],
		name: "Injected code in Markdown",
		rules: { "n/no-missing-import": "off" },
	},
	{
		extends: [vitest.configs.all],
		files: [TEST_FILES_GLOB],
		name: "Test files",
		rules: {
			"@typescript-eslint/no-unsafe-assignment": "off",
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							importNames: ["expect"],
							message: "Use the expect provided by the test context instead.",
							name: "vitest",
						},
					],
				},
			],
			"vitest/prefer-expect-assertions": "off",
		},
		settings: { vitest: { typecheck: true } },
	},
	{
		extends: [ymlConfigs["flat/standard"], ymlConfigs["flat/prettier"]],
		files: ["**/*.{yml,yaml}"],
		name: "YAML files",
		rules: {
			"yml/file-extension": "error",
			"yml/sort-keys": [
				"error",
				{ order: { type: "asc" }, pathPattern: "^.*$" },
			],
			"yml/sort-sequence-values": [
				"error",
				{ order: { type: "asc" }, pathPattern: "^.*$" },
			],
		},
	},
	{
		files: [
			".github/workflows/**/*.{yml,yaml}",
			".github/actions/**/*.{yml,yaml}",
		],
		name: "GitHub Action YAML files",
		rules: {
			"yml/sort-keys": "off",
		},
	},
	{
		extends: [packageJsonConfigs.recommended, packageJsonConfigs.stylistic],
		files: ["package.json"],
		name: "package.json file",
		rules: {
			// Disable, as long as we have "exports": null
			"package-json/valid-exports": "off",
		},
	},
);
