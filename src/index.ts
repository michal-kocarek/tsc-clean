import fs from "node:fs";
import path from "node:path";
import { parseArgs, styleText } from "node:util";
import ts from "typescript";

import packageJson from "../package.json" with { type: "json" };

const argsConfig = {
		// NOTE: use camelCase notation for argument names (that's similar to `tsc`)
		options: {
			/* eslint-disable perfectionist/sort-objects */
			project: {
				default: "tsconfig.json",
				helpDescription:
					"Path to configuration file for this project, or to a folder with a 'tsconfig.json'.",
				helpPlaceholder: "<path>",
				short: "p",
				type: "string",
			},
			dryRun: {
				default: false,
				helpDescription: "Do not delete any files.",
				type: "boolean",
			},
			verbose: {
				default: false,
				helpDescription: "Print verbose output.",
				type: "boolean",
			},
			version: {
				default: false,
				helpDescription: "Print version.",
				type: "boolean",
			},
			help: {
				default: false,
				helpDescription: "Print this message.",
				short: "h",
				type: "boolean",
			},
			/* eslint-enable perfectionist/sort-objects */
		},
	} as const,
	BIN_NAME = "tsc-clean";

// TODO: Fail on unknown arguments!

// TODO: Project can be path to folder! Beware And read probably outcome from ts API

function isNodeErrorOf<TError extends Error, TCode extends string>(
	error: unknown,
	errorClass: new () => TError,
	code?: TCode,
): error is TError & (typeof code extends undefined ? never : { code: TCode }) {
	if (!(error instanceof errorClass)) {
		return false;
	}

	return !(code !== undefined && "code" in error && error.code !== code);
}

function main() {
	let args: ReturnType<typeof parseArgs<typeof argsConfig>>;

	try {
		args = parseArgs(argsConfig);
	} catch (error) {
		if (isNodeErrorOf(error, TypeError, "ERR_PARSE_ARGS_UNKNOWN_OPTION")) {
			printError(`${error.message}.`);
			return;
		}

		throw error;
	}

	if (args.values.help) {
		const heading = (text: string) => styleText(["bold"], text),
			option = (name: string, description: string) =>
				`  ${styleText("blueBright", name.padEnd(23))}${description}`;

		print(
			[
				`${styleText("bold", BIN_NAME)} - Remove stale TypeScript build output`,
				"",
				heading("USAGE"),
				`  ${BIN_NAME} [options]`,
				"",
				heading("OPTIONS"),
				...Object.entries(argsConfig.options).map(([name, opts]) => {
					const keyParts = [`--${name}`];
					if ("short" in opts) {
						keyParts.push(`, -${opts.short}`);
					}
					switch (opts.type) {
						case "boolean":
							break;
						case "string":
							keyParts.push(` ${opts.helpPlaceholder}`);
							break;
					}

					return option(keyParts.join(""), opts.helpDescription);
				}),
			].join("\n"),
		);
		// eslint-disable-next-line n/no-process-exit -- Help must stop before cleanup starts.
		process.exit(0);
	}

	if (args.values.version) {
		print(
			`${BIN_NAME}/${packageJson.version} ${process.platform}-${process.arch} node-${process.versions.node} typescript-${ts.version}`,
		);

		// eslint-disable-next-line n/no-process-exit -- Help must stop before cleanup starts.
		process.exit(0);
	}

	const cwd = process.cwd(),
		tsconfigAbsolutePath = path.resolve(cwd, args.values.project),
		tsconfigRelativePath = path.relative(cwd, tsconfigAbsolutePath);
	if (
		tsconfigRelativePath === "" ||
		tsconfigRelativePath === ".." ||
		tsconfigRelativePath.startsWith(`..${path.sep}`) ||
		path.isAbsolute(tsconfigRelativePath)
	) {
		throw new Error(
			`Refusing to traverse outside current working directory to read tsconfig!`,
		);
	}

	print(`Using tsconfig: ${tsconfigRelativePath}`);

	const tsconfig = ts.getParsedCommandLineOfConfigFile(
		args.values.project,
		undefined,
		{
			...ts.sys,
			onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
				printError(JSON.stringify(diagnostic));
				throw new Error("Unrecoverable config file diagnostic");
			},
		},
	);

	// TODO: What if there is error in tsconfig? How to handle?

	if (tsconfig?.options.outDir === undefined) {
		throw new Error("outDir is required");
	}

	const outDirRelativePath = path.relative(
		path.dirname(tsconfigAbsolutePath),
		tsconfig.options.outDir,
	);
	if (
		outDirRelativePath === "" ||
		outDirRelativePath === ".." ||
		outDirRelativePath.startsWith(`..${path.sep}`) ||
		path.isAbsolute(outDirRelativePath)
	) {
		throw new Error(
			`Refusing to traverse outside safe paths containing tsconfig to process outDir!`,
		);
	}

	if (tsconfig.options.incremental === true) {
		throw new Error("Incremental mode is not supported");
	}

	if (tsconfig.options.tsBuildInfoFile !== undefined) {
		throw new Error("tsBuildInfoFile is not supported");
	}

	if (tsconfig.options.composite === true) {
		throw new Error("Composite mode is not supported");
	}

	if (tsconfig.options.project !== undefined) {
		throw new Error("Project mode is not supported");
	}

	if (tsconfig.options.declarationDir !== undefined) {
		throw new Error("declarationDir is not supported");
	}

	if (tsconfig.watchOptions) {
		throw new Error("Watch mode is not supported");
	}

	// TODO: Check for relative paths - are they normalized or whaat?

	// I’d make the guard more precise than comparing directory names: require an
	// Explicit outDir, then refuse if any source file in the TypeScript program is
	// Inside a directory the cleaner would scan. Apply the same check to declarationDir
	// If it is separate. This allows a normal src/ → dist/ project even when both sit
	// Under the project root, while rejecting in-place emission and output directories that
	// Contain source files. Check path containment by directory boundaries and account for
	// Symlinks before deleting.

	// TODO: stat.dev pro dist/ slozku se musi rovnat stat.dev pro kazdy soubor!

	print(JSON.stringify(tsconfig));

	const expectedOutDirPaths = new Set<string>();

	for (const file of tsconfig.fileNames) {
		const output = ts.getOutputFileNames(
				tsconfig,
				file,
				!ts.sys.useCaseSensitiveFileNames,
			),
			// TODO: statSync is okay for source, but for dist use lstatSync
			stat = fs.statSync(file);

		print(file, " => ", JSON.stringify(output), JSON.stringify(stat));

		output.forEach((fiePath) => expectedOutDirPaths.add(fiePath));
	}

	print(JSON.stringify(expectedOutDirPaths));

	type Verdict =
		| { path: string; reason: string; type: "skipped" }
		| { path: string; type: "removeDir" }
		| { path: string; type: "removeFile" };

	function readDir(dirPath: string): {
		dirIsEmpty: boolean;
		verdicts: Verdict[];
	} {
		const verdicts: Verdict[] = [],
			// TODO: Does this need to be here?
			stat = fs.lstatSync(dirPath);
		if (!stat.isDirectory()) {
			throw new Error(`Not a directory ${dirPath}!`);
		}

		let dirIsEmpty = true;

		for (const child of fs.readdirSync(dirPath)) {
			const fullPath = path.join(dirPath, child),
				fullPathStat = fs.lstatSync(fullPath);

			if (fullPathStat.dev !== stat.dev) {
				if (args.values.verbose) {
					verdicts.push({
						path: fullPath,
						reason: "different device",
						type: "skipped",
					});
				}
				dirIsEmpty = false;
				continue;
			}

			if (fullPathStat.isFile()) {
				if (expectedOutDirPaths.has(fullPath)) {
					if (args.values.verbose) {
						verdicts.push({
							path: fullPath,
							reason: "expected output file",
							type: "skipped",
						});
					}
					dirIsEmpty = false;
					continue;
				}

				verdicts.push({ path: fullPath, type: "removeFile" });
				continue;
			}

			if (fullPathStat.isDirectory()) {
				const result = readDir(fullPath);

				verdicts.push(...result.verdicts);

				if (!result.dirIsEmpty) {
					dirIsEmpty = false;
				}
				continue;
			}

			// Unknown file type
			dirIsEmpty = false;
		}

		if (dirIsEmpty) {
			verdicts.push({ path: dirPath, type: "removeDir" });
		} else {
			verdicts.push({
				path: dirPath,
				reason: "directory not empty",
				type: "skipped",
			});
		}

		return { dirIsEmpty, verdicts };
	}

	const result = readDir(tsconfig.options.outDir);

	// TODO: Merge these two switches into single loop, and nest the verbose and dryRun conditions down
	if (args.values.verbose) {
		for (const verdict of result.verdicts) {
			switch (verdict.type) {
				case "removeDir":
					print(`Remove empty directory: ${verdict.path}`);
					break;
				case "removeFile":
					print(`Remove file: ${verdict.path}`);
					break;
				case "skipped":
					print(`Skipped (${verdict.reason}): ${verdict.path}`);
					break;
			}
		}
	}

	// TODO: Avoid running if any of srcdirs is inside outdir - essentially so we don't wipe what we do have

	let removedDirs = 0,
		removedFiles = 0;

	if (!args.values.dryRun) {
		for (const verdict of result.verdicts) {
			switch (verdict.type) {
				case "removeDir":
					fs.rmdirSync(verdict.path);
					removedDirs++;
					break;
				case "removeFile":
					fs.rmSync(verdict.path, { recursive: false });
					removedFiles++;
					break;
				case "skipped":
					break;
			}
		}
	}

	if (args.values.dryRun || removedDirs > 0 || removedFiles > 0) {
		print(
			`${BIN_NAME}: ${args.values.dryRun ? "Would remove" : "Removed"} ${removedFiles.toFixed()} files${removedDirs > 0 ? ` and ${removedDirs.toFixed()} empty directories` : ""} from ${styleText("italic", outDirRelativePath)}`,
		);
	}

	// TODO: For tsc-clean, I’d make --dryRun print the files it would remove to stdout, followed by a count. A normal run
	//  Can print a short count; --verbose can print each removed path. Keep debug objects such as the current print(tsconfig)
	//  Out of normal output.
	//  Exit with 0 for success, including a dry run or nothing to remove; 1 for a cleanup or config error; and 2 for invalid CLI arguments.
	//  If you later want scripts to consume the file list, add a dedicated machine-readable option so the human summary does not get mixed into it.

	// TODO: Consider adding --all? To just wipe entire outDir?

	// TODO: On GHA, test it against different typescript versions installed. To make sure the API conforms!
}

function print(...messages: string[]) {
	// eslint-disable-next-line no-console
	console.log(messages.join(" "));
}

function printError(...messages: string[]): void {
	// eslint-disable-next-line no-console
	console.error(styleText("red", `error: ${messages.join(" ")}`));
}

main();
