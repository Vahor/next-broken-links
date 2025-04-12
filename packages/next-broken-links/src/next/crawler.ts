import { globSync } from "tinyglobby";
import { debug } from "../logger";
import type { ExtendedNextConfig } from "./parse-next-config";

export const crawlNextOutput = (config: ExtendedNextConfig) => {
	const files = globSync(
		[
			"**/*.html",
			"**/sitemap.xml",
			"**/sitemap/*.xml",
			"**/sitemap.xml.body",
			"**/page.js",
		],
		{
			cwd: config._vahor.cwd,
			onlyFiles: true,
			ignore: ["**/node_modules/**", "**/_next/**", "**/*/*.js", "**/*/*.json"],
		},
	);
	debug(
		`Found ${files.length} files in ${config._vahor.cwd}: [${files.join(", ")}]`,
	);
	return files;
};
