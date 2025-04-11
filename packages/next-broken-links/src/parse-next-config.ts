import chalk from "chalk";
import type { NextConfig } from "next";
import { debug, error, toolName, value } from "../logger";

export default function parseNextConfig(path: string) {
	const pattern = /next\.config\.[cm]?js|ts$/;
	if (!pattern.test(path)) {
		// ts only works with bun
		console.log(
			`${error} Invalid next config path: '${path}'. Expected a path ending with ${value("'next.config.js'")} file (mjs, cjs, ts or js).`,
		);
		process.exit(1);
	}
	try {
		const file = require(path).default as NextConfig;
		debug("Parsed next config file");
		debug(JSON.stringify(file, null, 2));
		checkSupportedConfiguration(file);
	} catch (e) {
		console.log(`${error} Failed to read next config file: \`${path}\``);
		console.log(`\t${chalk.red(e.message)}`);
		process.exit(1);
	}
	return {};
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
