import { error } from "./logger";
import type { BrokenLink } from "./next/validate-links";

export function prettyPrintResults(result: BrokenLink[]) {
	const groupedByFile = new Map<string, BrokenLink[]>();

	for (const link of result) {
		const file = link.file;
		if (!groupedByFile.has(file)) {
			groupedByFile.set(file, []);
		}
		groupedByFile.get(file)?.push(link);
	}

	const sortedFiles = Array.from(groupedByFile.keys()).sort();

	console.log(`${error} Found ${result.length} broken links`);

	for (const file of sortedFiles) {
		const links = groupedByFile
			.get(file)
			?.toSorted((a, b) => a.link.localeCompare(b.link));
		if (!links) continue;

		console.log();
		console.log(`${file} (${links.length} broken links)`);
		for (const link of links) {
			console.log(`\t- ${link.link}`);
		}
	}
}
