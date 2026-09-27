import { defineConfig } from "tsdown";

export default defineConfig({
	attw: {
		level: "error",
	},
	deps: {
		onlyBundle: [],
	},
	entry: ["src/**/*.{js,ts}", "!src/**/__tests__/**"],
	fixedExtension: false,
	publint: {
		strict: true,
	},
	unbundle: true,
});
