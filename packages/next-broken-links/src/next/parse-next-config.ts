import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import type { NextConfig } from "next";
import { debug, toolName, value } from "../logger";

export interface ExtendedNextConfig extends NextConfig {
	_vahor: {
		cwd: string;
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
		} catch (e) {
			// ignore
		}
	}
};

export default async function parseNextConfig(
	path: string | undefined,
): Promise<ExtendedNextConfig> {
	let finalPath: string | undefined = undefined;
	if (!path) {
		finalPath = getDefaultConfigPath(process.cwd());
		if (!finalPath) {
			throw new Error(
				`Could not find a next config file in ${value(
					process.cwd(),
				)}. Please specify a path using the ${value("--config")} option.`,
			);
		}
	} else {
		finalPath = path;

		const pattern = /next\.config\.[cm]?js|ts$/;
		if (!pattern.test(finalPath)) {
			// ts only works with bun
			throw new Error(
				`Invalid next config path: '${finalPath}'. Expected a path ending with ${value("'next.config.js'")} file (mjs, cjs, ts or js).`,
			);
		}
	}

	const cleanPath = join(process.cwd(), finalPath);
	debug(`cwd: ${value(process.cwd())}`);
	debug(`Reading next config file from ${value(cleanPath)} `);
	const config = (await import(cleanPath).then(
		(mod) => mod.default,
	)) as NextConfig;
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
}

const checkSupportedConfiguration = (config: NextConfig) => {
	if (config.output !== "export") {
		throw new Error(
			`${toolName} only supports ${value("'export'")} output mode.`,
		);
	}
	return true;
};
