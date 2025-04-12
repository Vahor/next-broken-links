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
			let withoutDomain = link.value.replace(/^https?:\/\//, "");
			if (!withoutDomain.startsWith("/")) {
				withoutDomain = withoutDomain.split("/").slice(1).join("/");
				withoutDomain = `/${withoutDomain}`;
			}
			//
			if (
				!allFiles.includes(withoutDomain) &&
				!allFiles.includes(`${withoutDomain}.html`) &&
				!allFiles.includes(`${withoutDomain}index.html`)
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
