import { Command } from "@commander-js/extra-typings";
import { name, version } from "../package.json" assert { type: "json" };
import { debug, error, success, withProgress } from "./logger";
import { crawlNextOutput } from "./next/crawler";
import { extractLinks } from "./next/extract";
import parseNextConfig from "./next/parse-next-config";
import { checkValidLinks } from "./next/validate-links";

const program = new Command()
	.name(name)
	.version(version)
	.description("Find broken links in your Next.js project.")
	.option("-c, --config <path>", "next.config.js path")
	.option("--domain <domain>", "Domain to check links against")
	.option("-v, --verbose", "Enable verbose mode");

program.parse();

const options = program.opts();
process.env.DEBUG = options.verbose ? "1" : "";
export type Options = typeof options;

const main = async () => {
	const config = (
		await withProgress([parseNextConfig(options.config)], {
			title: "Parsing next config",
			progress: (completed) => `Parsing next config: ${completed}/${1}`,
			success: "Parsed next config",
		})
	)[0];
	if (!config) {
		console.log(`${error} Failed to parse next config`);
		process.exit(1);
	}
	const htmlPages = crawlNextOutput(config);

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

	const result = (
		await withProgress([checkValidLinks(allLinks)], {
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
		console.log(`${error} Found ${result.length} broken links`);
		for (const link of result) {
			console.log(`\t${link.file}: ${link.link}`);
		}
		process.exit(1);
	} else {
		console.log(`${success} No broken links found`);
		process.exit(0);
	}
};

(async () => {
	await main();
})();
