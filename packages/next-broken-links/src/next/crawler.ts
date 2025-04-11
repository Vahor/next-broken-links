import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { globSync } from "tinyglobby";
import { debug } from "../logger";
import type { ExtendedNextConfig } from "./parse-next-config";

export const crawlNextOutput = (config: ExtendedNextConfig) => {
	const files = globSync("**/*.html", {
		cwd: config._vahor.cwd,
		onlyFiles: true,
	});
	debug(
		`Found ${files.length} files in ${config._vahor.cwd}: [${files.join(", ")}]`,
	);
	return files;
};

const HREF_REGEX = /href="([^"]+)"/g;
const IMAGE_REGEX = /<img\s+(?:[^>]*?\s+)?src="([^"]+)"/g;

interface Link {
	type: "link" | "image";
	value: string;
}

export const extractLinks = async (
	filePath: string,
	config: ExtendedNextConfig,
) => {
	const fullPath = join(config._vahor.cwd, filePath);
	const html = await readFile(fullPath, "utf8");
	const links = new Set<Link>();
	while (true) {
		const match = HREF_REGEX.exec(html);
		if (!match) {
			break;
		}
		const link = match[1];
		if (!isInternalLink(link)) continue;
		links.add({ type: "link", value: link });
	}
	while (true) {
		const match = IMAGE_REGEX.exec(html);
		if (!match) {
			break;
		}
		const link = match[1];
		if (!isInternalLink(link)) continue;
		links.add({ type: "image", value: link });
	}
	return { file: filePath, links: Array.from(links) };
};

const isInternalLink = (link: string | undefined): link is string => {
	if (!link) return false;
	return link.startsWith("/") && !link.startsWith("/_next/");
};

interface BrokenLink {
	file: string;
	link: string;
	type: "link" | "image";
}

export const checkValidLinks = async (
	files: Awaited<ReturnType<typeof extractLinks>>[],
) => {
	const result: BrokenLink[] = [];
	const allFiles = files.flatMap((file) => `/${file.file}`);
	for (const file of files) {
		const links = file.links;
		for (const link of links) {
			if (
				!allFiles.includes(link.value) &&
				!allFiles.includes(`${link.value}.html`)
			) {
				result.push({
					file: file.file,
					link: link.value,
					type: link.type,
				});
			}
		}
	}
	return result;
};
