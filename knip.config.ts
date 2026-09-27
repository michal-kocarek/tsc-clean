import type { KnipConfig } from "knip";

export default {
	entry: ["src/**/__tests__/*.test.*"],
	project: ["src/**/*.ts", "!src/**/__tests__/fixtures"],
	treatConfigHintsAsErrors: true,
} satisfies KnipConfig;
