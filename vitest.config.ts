import { defineConfig } from "vitest/config";

const FIXTURES_GLOB = "**/__tests__/fixtures/**";

export default defineConfig({
	test: {
		coverage: {
			exclude: [FIXTURES_GLOB],
			include: ["src"],
			reporter: ["html", "lcov"],
		},
		detectAsyncLeaks: true,
		exclude: ["dist", "node_modules", FIXTURES_GLOB],
		expect: {
			requireAssertions: true,
		},
		isolate: false,
		projects: [
			{
				extends: true,
				test: {
					exclude: ["src/**/*.e2e.test.ts"],
					include: ["src/**/*.test.ts"],
					name: { color: "blue", label: "unit" },
				},
			},
			{
				extends: true,
				test: {
					include: ["src/**/*.e2e.test.ts"],
					name: { color: "cyan", label: "e2e" },
				},
			},
		],
		sequence: {
			concurrent: true,
			shuffle: {
				files: true,
				tests: true,
			},
		},
		setupFiles: ["console-fail-test/setup"],
		strictTags: true,
	},
});
