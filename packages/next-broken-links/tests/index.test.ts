import { beforeEach, describe, expect, mock, test } from "bun:test";
import { extractFromHtml } from "../src/next/extract";

beforeEach(() => {
	// xyz.mockClear();
});

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

	test("should ignore external images when no domain is provided", () => {
		const html = '<img src="https://example.com/image.jpg" alt="External" />';
		const links = extractFromHtml(html);
		expect(links).toHaveLength(0);
	});

	test("should include external images when matching domain is provided", () => {
		const html = '<img src="https://example.com/image.jpg" alt="External" />';
		const links = extractFromHtml(html, "example.com");
		expect(links).toHaveLength(1);
		expect(links[0]).toEqual({ type: "image", value: "https://example.com/image.jpg" });
	});
});
