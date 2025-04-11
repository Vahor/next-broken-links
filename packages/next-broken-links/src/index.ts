import { Command } from "@commander-js/extra-typings";
import packageJson from "../package.json" assert { type: "json" };
import { debug, error, success, withProgess } from "./logger";
import { checkValidLinks, crawlNextOutput, extractLinks } from "./next/crawler";
import parseNextConfig from "./next/parse-next-config";

const program = new Command()
	.name(packageJson.name)
	.version(packageJson.version)
	.description("Find broken links in your Next.js project.")
	.option("-c, --config <path>", "next.config.js path", "./next.config.js")
	.option("-v, --verbose", "Enable verbose mode");

program.parse();

const options = program.opts();
process.env.DEBUG = options.verbose ? "1" : "";
export type Options = typeof options;

const main = async () => {
	const config = parseNextConfig(options.config);
	const htmlPages = crawlNextOutput(config);

	const allLinks = await withProgess(
		htmlPages.map((file) => extractLinks(file, config)),
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
		await withProgess([checkValidLinks(allLinks)], {
			title: "Checking links",
			progress: (completed) =>
				`Checking links: ${completed}/${allLinks.length}`,
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
