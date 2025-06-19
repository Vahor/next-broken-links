import { statSync } from "node:fs";
import { dirname, join } from "node:path";
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

		const pattern = /next\.config\.[cm]?js|ts$/;
		if (!pattern.test(finalPath)) {
			// ts only works with bun
			throw new Error(
				`Invalid next config path: ${value(finalPath)}. Expected a path ending with ${value("next.config.js")} file (mjs, cjs, ts or js).`,
			);
		}
	}

	const cleanPath = join(cwd, finalPath);
	debug(`cwd: ${value(cwd)}`);
	debug(`Reading next config file from ${value(cleanPath)} `);
	const config = (await import(cleanPath).then(
		(mod) => mod.default,
	)) as NextConfig;
	debug("Parsed next config file");
	debug(JSON.stringify(config, null, 2));
	checkSupportedConfiguration(config);

	let outputDir: string;
	if (config.output === "export") {
		outputDir = config.distDir || "out";
		outputDir = join(dirname(cleanPath), outputDir);
	} else {
		// if (config.output === undefined) {
		outputDir = config.distDir || ".next";
		outputDir = join(dirname(cleanPath), outputDir);
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
		outputDir = join(cwd, options.distDir);
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
