import { join } from "node:path";
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
			cwd: config._vahor.outputDir,
			onlyFiles: true,
			ignore: ["**/node_modules/**", "**/_next/**", "**/*/*.js", "**/*/*.json"],
		},
	);

	debug(
		`Found ${files.length} files in ${config._vahor.outputDir}: [${files.join(", ")}]`,
	);
	return files;
};

export const crawlPublicAssets = (config: ExtendedNextConfig) => {
	const publicDir = join(config._vahor.root, "public");
	const files = globSync("**/*", {
		cwd: publicDir,
		onlyFiles: true,
	});

	debug(`Found ${files.length} assets in ${publicDir}: [${files.join(", ")}]`);
	return files;
};
