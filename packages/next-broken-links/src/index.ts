import { Command, Option } from "@commander-js/extra-typings";
import { existsSync, statSync } from "node:fs";
import { name, version } from "../package.json" assert { type: "json" };
import { prettyPrintResults } from "./formatter";
import { debug, error, success, withProgress } from "./logger";
import { crawlNextOutput, crawlPublicAssets } from "./next/crawler";
import { extractLinks } from "./next/extract";
import parseNextConfig, {
	createFallbackConfig,
	type ExtendedNextConfig,
} from "./next/parse-next-config";
import { checkValidLinks } from "./next/validate-links";

const program = new Command()
	.name(name)
	.version(version)
	.description("Find broken links in your Next.js project.")
	.option("-c, --config <path>", "next.config.js path")
	.option("--domain <domain>", "Domain to check links against")
	.option("-v, --verbose", "Enable verbose mode")
	.addOption(
		new Option("--output <type>", "Output type: 'export' for static export, undefined for standard build")
			.choices(["export"])
	)
	.option("--distDir <path>", "Custom dist directory path")
	.option(
		"--no-config",
		"Skip parsing next.config file and use provided options",
	);

program.parse();

const options = program.opts();
process.env.DEBUG = options.verbose ? "1" : "";
export type CliOptions = typeof options;

const validateExtendedConfig = (config: ExtendedNextConfig) => {
	// Validate the actual output directory path from ExtendedNextConfig
	if (!existsSync(config._vahor.outputDir)) {
		console.log(`${error} Output directory does not exist: "${config._vahor.outputDir}"`);
		process.exit(1);
	}
	
	const stats = statSync(config._vahor.outputDir);
	if (!stats.isDirectory()) {
		console.log(`${error} Output path is not a directory: "${config._vahor.outputDir}"`);
		process.exit(1);
	}
};

const main = async () => {
	let config: ExtendedNextConfig;

	if (options.config === false) {
		debug("Skipping next.config parsing due to --no-config flag");
		config = createFallbackConfig(options);
		debug(`Using fallback config: ${JSON.stringify(config, null, 2)}`);
	} else {
		const parsedConfig = (
			await withProgress([parseNextConfig(options.config)], {
				title: "Parsing next config",
				progress: (completed) => `Parsing next config: ${completed}/${1}`,
				success: "Parsed next config",
			})
		)[0];
		if (!parsedConfig) {
			console.log(`${error} Failed to parse next config`);
			process.exit(1);
		}
		config = parsedConfig;
	}
	
	validateExtendedConfig(config);
	
	const htmlPages = crawlNextOutput(config);
	const publicAssets = crawlPublicAssets(config);

	const allLinks = await withProgress(
		htmlPages.map((file) => extractLinks(file, config, options)),
		{
			title: "Extracting links",
			progress: (completed) =>
				`Extracting links: ${completed}/${htmlPages.length}`,
			success: "Extracted links from all pages",
		},
	);
	debug(`Found ${allLinks.length} links`);
	debug(JSON.stringify(allLinks, null, 2));

	const allAssets = publicAssets.map((file) => ({
		file,
		links: [],
	}));

	const result = (
		await withProgress([checkValidLinks([...allLinks, ...allAssets])], {
			title: "Checking links",
			progress: (completed) =>
				`Checking links: ${completed}/${allLinks.length}`,
			success: "Checked links",
		})
	)[0];

	if (!result) {
		console.log(`${error} Failed to check links`);
		process.exit(1);
	}

	if (result.length) {
		prettyPrintResults(result);
		process.exit(1);
	} else {
		console.log(`${success} Found 0 broken links`);
		process.exit(0);
	}
};

(async () => {
	await main();
})();
