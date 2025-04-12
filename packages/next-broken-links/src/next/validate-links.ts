import type { Links } from "./extract";

interface BrokenLink {
	file: string;
	link: string;
	type: "link" | "image";
}

export const checkValidLinks = async (files: Links[]) => {
	const result: BrokenLink[] = [];
	const allFiles = files.flatMap((file) => `/${file.file}`);
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
