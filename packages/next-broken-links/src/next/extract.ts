import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import type { Options } from "..";
import { debug } from "../logger";
import type { ExtendedNextConfig } from "./parse-next-config";

const LINK_REGEX = /<a[^>]+href="([^"]+)"/g;

interface Link {
	type: "link";
	value: string;
}

export interface Links {
	file: string;
	links: Link[];
}

const isInternalLink = (
	link: string | undefined,
	domain: string | undefined,
): link is string => {
	if (!link) return false;
	if (link.startsWith("/")) {
		return !link.startsWith("/_next/");
	}
	// Skip links that are not relative if domain is not set
	if (!domain) {
		debug(`Skipping link: '${link}' as domain is not set`);
		return false;
	}
	try {
		const url = new URL(link);
		if (domain && url.hostname !== domain) {
			return false;
		}
		const path = url.pathname;
		if (path.startsWith("/_next/")) return false;
		return true;
	} catch (e) {
		debug(`Invalid link: ${link} (${(e as Error).message})`);
		return false;
	}
};

export const extractFromHtml = (html: string, domain?: string): Link[] => {
	const links = new Map<string, Link>();
	while (true) {
		const match = LINK_REGEX.exec(html);
		if (!match) {
			break;
		}
		const link = match[1];
		if (!isInternalLink(link, domain)) continue;
		links.set(link, { type: "link", value: link });
	}
	return Array.from(links.values());
};

export const extractFromSitemap = (xml: string, domain?: string): Link[] => {
	const links = new Map<string, Link>();
	const parser = new XMLParser();
	const doc = parser.parse(xml);
	for (const url of doc.urlset.url) {
		const loc = url.loc;
		if (!loc) continue;
		if (!isInternalLink(loc, domain)) continue;
		links.set(loc, { type: "link", value: loc });
		// TODO: add support for images
	}
	return Array.from(links.values());
};

export const extractLinks = async (
	filePath: string,
	config: ExtendedNextConfig,
	options: Options,
): Promise<Links> => {
	const fullPath = join(config._vahor.cwd, filePath);
	if (fullPath.endsWith(".html")) {
		const raw = await readFile(fullPath, "utf8");
		return {
			file: filePath,
			links: extractFromHtml(raw, options.domain),
		};
	}
	if (
		fullPath.endsWith("sitemap.xml") ||
		fullPath.endsWith("sitemap.xml.body")
	) {
		const raw = await readFile(fullPath, "utf8");
		return {
			file: filePath,
			links: extractFromSitemap(raw, options.domain),
		};
	}
	return {
		file: filePath,
		links: [],
	};
};
