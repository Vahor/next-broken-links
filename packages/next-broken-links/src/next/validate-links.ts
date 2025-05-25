import type { Links } from "./extract";

export interface BrokenLink {
	file: string;
	link: string;
	type: "link" | "image";
}

export const checkValidLinks = async (files: Links[]) => {
	const result: BrokenLink[] = [];
	const allFiles = files.flatMap((file) => `/${file.file}`);
	// TODO: clean this part, and handle nested sitemaps
	if (
		allFiles.includes("/sitemap.xml.body") &&
		!allFiles.includes("/sitemap.xml")
	) {
		allFiles.push("/sitemap.xml");
	}
	for (const file of files) {
		const links = file.links;
		for (const link of links) {
			// TODO: clean this part
			let relativePath = link.value.replace(/^https?:\/\//, "");
			if (!relativePath.startsWith("/")) {
				relativePath = relativePath.split("/").slice(1).join("/");
				relativePath = `/${relativePath}`;
			}
			//
			// remove query params
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			relativePath = relativePath.split("?")[0]!;

			// remove hash
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			relativePath = relativePath.split("#")[0]!;

			if (
				!allFiles.includes(relativePath) &&
				!allFiles.includes(`${relativePath}page.js`) &&
				!allFiles.includes(`${relativePath}.html`) &&
				!allFiles.includes(`${relativePath}index.html`)
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
