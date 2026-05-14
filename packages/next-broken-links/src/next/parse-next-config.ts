import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { NextConfig } from "next";
import type { CliOptions } from "..";
import { debug, value } from "../logger";

export interface ExtendedNextConfig extends NextConfig {
	_vahor: {
		outputDir: string;
		root: string;
	};
}

const validExtensions = ["js", "mjs", "cjs", "ts"];
const validConfigPathPattern = /(^|[/\\])next\.config\.(?:[cm]?js|ts)$/;
const productionBuildPhase = "phase-production-build";

type NextConfigResult = NextConfig | Promise<NextConfig>;
type NextConfigFunction = (
	phase: string,
	options: { defaultConfig: NextConfig },
) => NextConfigResult;
type NextConfigExport = NextConfig | Promise<NextConfig> | NextConfigFunction;

const getDefaultConfigPath = (cwd: string) => {
	for (const ext of validExtensions) {
		const fileName = `next.config.${ext}`;
		const filePath = join(cwd, fileName);
		try {
			if (statSync(filePath).isFile()) {
				return fileName;
			}
		} catch (_e) {
			// ignore
		}
	}
};

const resolveNextConfig = async (
	configExport: NextConfigExport,
): Promise<NextConfig> => {
	const config = await configExport;
	if (typeof config === "function") {
		return config(productionBuildPhase, { defaultConfig: {} });
	}
	return config ?? {};
};

export default async function parseNextConfig(
	path: string | undefined,
): Promise<ExtendedNextConfig> {
	let finalPath: string | undefined;
	const cwd = process.cwd();
	if (!path) {
		finalPath = getDefaultConfigPath(cwd);
		if (!finalPath) {
			throw new Error(
				`Could not find a next config file in ${value(
					cwd,
				)}. Please specify a path using the ${value("--config")} option.`,
			);
		}
	} else {
		finalPath = path;

		if (!validConfigPathPattern.test(finalPath)) {
			// ts only works with bun
			throw new Error(
				`Invalid next config path: ${value(finalPath)}. Expected a path ending with ${value("next.config.js")} file (mjs, cjs, ts or js).`,
			);
		}
	}

	const cleanPath = resolve(cwd, finalPath);
	debug(`cwd: ${value(cwd)}`);
	debug(`Reading next config file from ${value(cleanPath)} `);
	const mod = await import(pathToFileURL(cleanPath).href);
	const config = await resolveNextConfig(
		(mod.default ?? mod) as NextConfigExport,
	);
	debug("Parsed next config file");
	debug(JSON.stringify(config, null, 2));
	checkSupportedConfiguration(config);

	let outputDir: string;
	if (config.output === "export") {
		outputDir = config.distDir || "out";
		outputDir = resolve(dirname(cleanPath), outputDir);
	} else {
		outputDir = config.distDir || ".next";
		outputDir = resolve(dirname(cleanPath), outputDir);
		outputDir = join(outputDir, "server", "app");
	}
	return {
		...config,
		_vahor: {
			outputDir,
			root: dirname(cleanPath),
		},
	};
}

const checkSupportedConfiguration = (config: NextConfig) => {
	if (!(config.output === "export" || config.output === undefined)) {
		throw new Error(
			`Invalid export configuration, expected ${value(
				"export",
			)} or ${value("undefined")} but got ${value(config.output)}`,
		);
	}
	return true;
};

export const createFallbackConfig = (
	options: CliOptions,
): ExtendedNextConfig => {
	const cwd = process.cwd();
	const output = options.output === "export" ? "export" : undefined;
	let outputDir: string;

	if (options.distDir) {
		outputDir = resolve(cwd, options.distDir);
		if (output !== "export") {
			outputDir = join(outputDir, "server", "app");
		}
	} else if (output === "export") {
		outputDir = join(cwd, "out");
	} else {
		outputDir = join(cwd, ".next", "server", "app");
	}

	return {
		output,
		distDir: options.distDir || (output === "export" ? "out" : ".next"),
		_vahor: {
			outputDir,
			root: cwd,
		},
	};
};
