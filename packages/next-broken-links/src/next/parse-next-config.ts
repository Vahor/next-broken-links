import { dirname, join } from "node:path";
import chalk from "chalk";
import type { NextConfig } from "next";
import { debug, error, toolName, value } from "../logger";

export interface ExtendedNextConfig extends NextConfig {
	_vahor: {
		cwd: string;
	};
}

export default function parseNextConfig(path: string) {
	const pattern = /next\.config\.[cm]?js|ts$/;
	if (!pattern.test(path)) {
		// ts only works with bun
		console.log(
			`${error} Invalid next config path: '${path}'. Expected a path ending with ${value("'next.config.js'")} file (mjs, cjs, ts or js).`,
		);
		process.exit(1);
	}

	const cleanPath = join(process.cwd(), path);
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
