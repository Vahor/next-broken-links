import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { Parser } from "htmlparser2";
import { default as pm } from "picomatch";
import type { CliOptions } from "..";
import { debug } from "../logger";
import type { ExtendedNextConfig } from "./parse-next-config";

interface Link {
	type: "link" | "image";
	value: string;
}

export interface Links {
	file: string;
	links: Link[];
}

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const getDomainHost = (domain: string | undefined) => {
	if (!domain) return undefined;
	try {
		return new URL(domain.includes("://") ? domain : `https://${domain}`).host;
	} catch (_e) {
		return domain.toLowerCase();
	}
};

const isHttpUrl = (url: URL) => HTTP_PROTOCOLS.has(url.protocol);

const isInternalLink = (
	link: string | undefined,
	domain: string | undefined,
): link is string => {
	const trimmedLink = link?.trim();
	if (!trimmedLink || trimmedLink.startsWith("#")) return false;

	const domainHost = getDomainHost(domain);

	if (trimmedLink.startsWith("//")) {
		if (!domainHost) {
			debug(
				`Skipping protocol-relative link: '${trimmedLink}' as domain is not set`,
			);
			return false;
		}
		try {
			const url = new URL(`https:${trimmedLink}`);
			return url.host === domainHost && !url.pathname.startsWith("/_next/");
		} catch (e) {
			debug(
				`Invalid protocol-relative link: ${trimmedLink} (${(e as Error).message})`,
			);
			return false;
		}
	}

	if (trimmedLink.startsWith("/")) {
		return !trimmedLink.startsWith("/_next/");
	}

	if (!domainHost) {
		debug(`Skipping link: '${trimmedLink}' as domain is not set`);
		return false;
	}

	try {
		const url = new URL(trimmedLink);
		if (!isHttpUrl(url)) return false;
		if (url.host !== domainHost) return false;
		return !url.pathname.startsWith("/_next/");
	} catch (e) {
		debug(`Invalid link: ${trimmedLink} (${(e as Error).message})`);
		return false;
	}
};

const parseSrcset = (srcset: string) =>
	srcset
		.split(",")
		.map((candidate) => candidate.trim().split(/\s+/)[0])
		.filter((candidate): candidate is string => Boolean(candidate));

export const extractFromHtml = (html: string, domain?: string): Link[] => {
	const links = new Map<string, Link>();

	const addLink = (type: Link["type"], value: string | undefined) => {
		const trimmedValue = value?.trim();
		if (!isInternalLink(trimmedValue, domain)) return;
		links.set(trimmedValue, { type, value: trimmedValue });
	};

	const parser = new Parser(
		{
			onopentag(name, attributes) {
				if (name === "a") {
					addLink("link", attributes.href);
					return;
				}

				if (name !== "img") return;

				addLink("image", attributes.src);
				const srcset = attributes.srcset;
				if (!srcset) return;
				for (const src of parseSrcset(srcset)) {
					addLink("image", src);
				}
			},
		},
		{
			decodeEntities: true,
			lowerCaseAttributeNames: true,
			lowerCaseTags: true,
		},
	);

	parser.write(html);
	parser.end();

	return Array.from(links.values());
};

type XmlRecord = Record<string, unknown>;

const asRecord = (value: unknown): XmlRecord | undefined => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return undefined;
	}
	return value as XmlRecord;
};

const asArray = <T>(value: T | T[] | undefined): T[] => {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
};

const getText = (value: unknown): string | undefined => {
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	const record = asRecord(value);
	const text = record?.["#text"];
	return typeof text === "string" ? text : undefined;
};

const getFirstText = (record: XmlRecord, keys: string[]) => {
	for (const key of keys) {
		const text = getText(record[key]);
		if (text) return text;
	}
};

export const extractFromSitemap = (xml: string, domain?: string): Link[] => {
	const links = new Map<string, Link>();
	const parser = new XMLParser({ ignoreAttributes: false });
	const doc = asRecord(parser.parse(xml));
	if (!doc) return [];

	const addLink = (type: Link["type"], value: string | undefined) => {
		const trimmedValue = value?.trim();
		if (!isInternalLink(trimmedValue, domain)) return;
		links.set(trimmedValue, { type, value: trimmedValue });
	};

	const urlset = asRecord(doc.urlset);
	for (const urlEntry of asArray(urlset?.url)) {
		const url = asRecord(urlEntry);
		if (!url) continue;

		addLink("link", getFirstText(url, ["loc"]));

		for (const imageEntry of asArray(url["image:image"] ?? url.image)) {
			const image = asRecord(imageEntry);
			if (!image) continue;
			addLink("image", getFirstText(image, ["image:loc", "loc"]));
		}
	}

	const sitemapindex = asRecord(doc.sitemapindex);
	for (const sitemapEntry of asArray(sitemapindex?.sitemap)) {
		const sitemap = asRecord(sitemapEntry);
		if (!sitemap) continue;
		addLink("link", getFirstText(sitemap, ["loc"]));
	}

	return Array.from(links.values());
};

export const extractLinks = async (
	filePath: string,
	config: ExtendedNextConfig,
	options: CliOptions,
): Promise<Links> => {
	const isMatch = options.ignore ? pm(options.ignore) : () => false;
	const fullPath = join(config._vahor.outputDir, filePath);
	let links: Link[] = [];
	if (fullPath.endsWith(".html")) {
		const raw = await readFile(fullPath, "utf8");
		links = extractFromHtml(raw, options.domain);
	}
	if (
		filePath.endsWith("sitemap.xml") ||
		filePath.endsWith("sitemap.xml.body") ||
		filePath.includes("sitemap/")
	) {
		const raw = await readFile(fullPath, "utf8");
		links = extractFromSitemap(raw, options.domain);
	}
	return {
		file: filePath,
		links: links.filter((link) => !isMatch(link.value)),
	};
};
