import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import type { NextConfig } from "next";
import { debug, error, toolName, value } from "../logger";

export interface ExtendedNextConfig extends NextConfig {
	_vahor: {
		cwd: string;
	};
}

const validExtensions = ["js", "mjs", "cjs", "ts"];

const getDefaultConfigPath = (cwd: string) => {
	for (const ext of validExtensions) {
		const filePath = join(cwd, `next.config.${ext}`);
		if (statSync(filePath).isFile()) {
			return filePath;
		}
	}
};

export default function parseNextConfig(
	path: string | undefined,
): ExtendedNextConfig {
	let finalPath: string | undefined = undefined;
	if (!path) {
		finalPath = getDefaultConfigPath(process.cwd());
		if (!finalPath) {
			console.log(
				`${error} Could not find a next config file in ${value(
					process.cwd(),
				)}. Please specify a path using the ${value("--config")} option.`,
			);
			process.exit(1);
		}
	} else {
		finalPath = path;

		const pattern = /next\.config\.[cm]?js|ts$/;
		if (!pattern.test(finalPath)) {
			// ts only works with bun
			console.log(
				`${error} Invalid next config path: '${finalPath}'. Expected a path ending with ${value("'next.config.js'")} file (mjs, cjs, ts or js).`,
			);
			process.exit(1);
		}
	}

	const cleanPath = join(process.cwd(), finalPath);
	debug(`cwd: ${value(process.cwd())}`);
	try {
		debug(`Reading next config file from ${value(cleanPath)} `);
		const config = require(cleanPath).default as NextConfig;
		debug("Parsed next config file");
		debug(JSON.stringify(config, null, 2));
		checkSupportedConfiguration(config);

		const outputDir = config.distDir || "out";
		const cwd = join(dirname(cleanPath), outputDir);
		return {
			...config,
			_vahor: {
				cwd,
			},
		};
	} catch (e) {
		console.log(
			`${error} Failed to read next config file: ${value(`'${cleanPath}'`)} `,
		);
		console.log(`\t${chalk.red((e as Error).message)} `);
		process.exit(1);
	}
}

const checkSupportedConfiguration = (config: NextConfig) => {
	if (config.output !== "export") {
		console.log(
			`${error} ${toolName} only supports ${value("'export'")} output mode.`,
		);
		process.exit(1);
	}
	return true;
};
