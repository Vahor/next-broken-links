import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractFromHtml, extractFromSitemap } from "../src/next/extract";
import parseNextConfig from "../src/next/parse-next-config";
import {
	checkValidLinks,
	normalizeLinkToPath,
} from "../src/next/validate-links";

describe("extract", () => {
	test("should extract links from a tags", () => {
		const html = '<a href="/test">Test</a>';
		const links = extractFromHtml(html);
		expect(links).toHaveLength(1);
		expect(links[0]).toEqual({ type: "link", value: "/test" });
	});

	test("should extract images from img tags", () => {
		const html = '<img src="/image.jpg" alt="Test" />';
		const links = extractFromHtml(html);
		expect(links).toHaveLength(1);
		expect(links[0]).toEqual({ type: "image", value: "/image.jpg" });
	});

	test("should extract both links and images", () => {
		const html = '<a href="/page">Page</a><img src="/image.jpg" alt="Test" />';
		const links = extractFromHtml(html);
		expect(links).toHaveLength(2);
		expect(links).toContainEqual({ type: "link", value: "/page" });
		expect(links).toContainEqual({ type: "image", value: "/image.jpg" });
	});

	test("should extract single-quoted and uppercase attributes", () => {
		const html =
			"<A HREF = '/test'>Test</A><IMG SRC = '/image.jpg' alt='Test'>";
		const links = extractFromHtml(html);
		expect(links).toContainEqual({ type: "link", value: "/test" });
		expect(links).toContainEqual({ type: "image", value: "/image.jpg" });
	});

	test("should extract image srcset candidates", () => {
		const html = '<img srcset="/small.jpg 1x, /large.jpg 2x" alt="Test" />';
		const links = extractFromHtml(html);
		expect(links).toContainEqual({ type: "image", value: "/small.jpg" });
		expect(links).toContainEqual({ type: "image", value: "/large.jpg" });
	});

	test("should ignore external images when no domain is provided", () => {
		const html = '<img src="https://example.com/image.jpg" alt="External" />';
		const links = extractFromHtml(html);
		expect(links).toHaveLength(0);
	});

	test("should include external images when matching domain is provided", () => {
		const html = '<img src="https://example.com/image.jpg" alt="External" />';
		const links = extractFromHtml(html, "example.com");
		expect(links).toHaveLength(1);
		expect(links[0]).toEqual({
			type: "image",
			value: "https://example.com/image.jpg",
		});
	});

	test("should include protocol-relative links when matching domain is provided", () => {
		const html = '<a href="//example.com/page">Page</a>';
		const links = extractFromHtml(html, "https://example.com");
		expect(links).toEqual([{ type: "link", value: "//example.com/page" }]);
	});
});

describe("sitemap extraction", () => {
	test("should extract a sitemap with a single url entry", () => {
		const xml =
			"<urlset><url><loc>https://example.com/only</loc></url></urlset>";
		expect(extractFromSitemap(xml, "example.com")).toEqual([
			{ type: "link", value: "https://example.com/only" },
		]);
	});

	test("should extract sitemap indexes", () => {
		const xml =
			"<sitemapindex><sitemap><loc>https://example.com/sitemap/posts.xml</loc></sitemap></sitemapindex>";
		expect(extractFromSitemap(xml, "example.com")).toEqual([
			{ type: "link", value: "https://example.com/sitemap/posts.xml" },
		]);
	});

	test("should extract sitemap image locations", () => {
		const xml = `
			<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
				<url>
					<loc>https://example.com/page</loc>
					<image:image>
						<image:loc>https://example.com/image.jpg</image:loc>
					</image:image>
				</url>
			</urlset>
		`;
		expect(extractFromSitemap(xml, "example.com")).toContainEqual({
			type: "image",
			value: "https://example.com/image.jpg",
		});
	});
});

describe("validate", () => {
	test("should normalize links to output paths", () => {
		expect(
			normalizeLinkToPath("https://example.com/docs/page?a=1#top", {
				basePath: "/docs",
			}),
		).toBe("/page");
		expect(normalizeLinkToPath("//example.com/about/")).toBe("/about");
	});

	test("should validate html routes, assets, and sitemap body aliases", async () => {
		const result = await checkValidLinks([
			{
				file: "index.html",
				links: [
					{ type: "link", value: "/" },
					{ type: "link", value: "/about?x=1#title" },
					{ type: "link", value: "/sitemap.xml" },
					{ type: "image", value: "/image.jpg" },
					{ type: "link", value: "https://example.com/missing" },
				],
			},
			{ file: "about.html", links: [] },
			{ file: "sitemap.xml.body", links: [] },
			{ file: "image.jpg", links: [] },
		]);

		expect(result).toEqual([
			{
				file: "index.html",
				link: "https://example.com/missing",
				type: "link",
			},
		]);
	});

	test("should handle basePath and trailing slash outputs", async () => {
		const result = await checkValidLinks(
			[
				{
					file: "index.html",
					links: [
						{ type: "link", value: "/docs/about/" },
						{ type: "link", value: "/docs/contact" },
					],
				},
				{ file: "about/index.html", links: [] },
				{ file: "docs/contact.html", links: [] },
			],
			{ basePath: "/docs", trailingSlash: true },
		);

		expect(result).toEqual([]);
	});
});

describe("parse next config", () => {
	test("should load an async function config from an absolute path", async () => {
		const root = await mkdtemp(join(tmpdir(), "next-broken-links-"));
		try {
			const configPath = join(root, "next.config.mjs");
			await writeFile(
				configPath,
				`export default async (phase) => ({ output: "export", distDir: phase === "phase-production-build" ? "custom-out" : "wrong" });`,
			);

			const config = await parseNextConfig(configPath);

			expect(config.output).toBe("export");
			expect(config._vahor.root).toBe(root);
			expect(config._vahor.outputDir).toBe(join(root, "custom-out"));
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
