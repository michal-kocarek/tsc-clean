import { execa } from "execa";
import { stripVTControlCharacters } from "node:util";
import { describe, it } from "vitest";

const binPath = require.resolve("../../bin/tsc-cleaner");

async function runTscCleaner(
	args: string[],
	opts: { allowFailure: boolean } = { allowFailure: false },
) {
	const result = await execa(binPath, args, {
		env: {
			FORCE_COLOR: undefined,
			NO_COLOR: "1",
		},
		reject: !opts.allowFailure,
	});

	result.stdout = stripVTControlCharacters(result.stdout);
	result.stderr = stripVTControlCharacters(result.stderr);

	return result;
}

describe("tsc-cleaner", () => {
	it("should print help", async ({ expect }) => {
		const result = await runTscCleaner(["--help"]);

		expect(result.exitCode).toBe(0);
		expect(result.stderr).toBe("");
		expect(result.stdout).toMatchSnapshot();
	});

	it("should print version", async ({ expect }) => {
		const result = await runTscCleaner(["--version"]);

		expect(result.exitCode).toBe(0);
		expect(result.stderr).toBe("");
		expect(result.stdout).toMatch(
			/^tsc-clean\/\d+\.\d+\.\d+ [\w\-.]+ [\w\-.]+ [\w\-.]+$/v,
		);
	});

	it("should fail nicely when called with unknown argument", async ({
		expect,
	}) => {
		const result = await runTscCleaner(["--unknown"], {
			allowFailure: true,
		});

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toBe("error: Unknown option '--unknown'.");
		expect(result.stdout).toBe("");
	});
});
