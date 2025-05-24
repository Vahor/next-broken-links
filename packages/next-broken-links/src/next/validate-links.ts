import { join, relative } from "node:path";
import chalk from "chalk";
import type { Links } from "./extract";
import type { ExtendedNextConfig } from "./parse-next-config";

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

const mapHtmlToSourceFile = (htmlFile: string, config: ExtendedNextConfig): string => {
	if (htmlFile.endsWith('.html')) {
		let sourcePath = htmlFile.replace('.html', '');
		
		if (sourcePath === 'index') {
			sourcePath = 'page.tsx';
		} else if (sourcePath.endsWith('/index')) {
			sourcePath = sourcePath.replace('/index', '/page.tsx');
		} else {
			sourcePath = `${sourcePath}/page.tsx`;
		}
		
		const fullSourcePath = join(config._vahor.root, 'src', 'app', sourcePath);
		return relative(config._vahor.root, fullSourcePath);
	}
	
	if (htmlFile.includes('sitemap')) {
		const sitemapSource = join(config._vahor.root, 'src', 'app', 'sitemap.ts');
		return relative(config._vahor.root, sitemapSource);
	}
	
	return htmlFile;
};

export const printBrokenLinksTable = (brokenLinks: BrokenLink[], config: ExtendedNextConfig) => {
	const groupedByFile = new Map<string, BrokenLink[]>();
	
	for (const link of brokenLinks) {
		const sourceFile = mapHtmlToSourceFile(link.file, config);
		if (!groupedByFile.has(sourceFile)) {
			groupedByFile.set(sourceFile, []);
		}
		const fileLinks = groupedByFile.get(sourceFile);
		if (fileLinks) {
			fileLinks.push(link);
		}
	}
	
	const sortedFiles = Array.from(groupedByFile.keys()).sort();
	
	console.log();
	for (const sourceFile of sortedFiles) {
		const links = groupedByFile.get(sourceFile);
		if (!links) continue;
		const sortedLinks = links.sort((a, b) => a.link.localeCompare(b.link));
		
		console.log(chalk.bold.blue(`📄 ${sourceFile}`));
		console.log(chalk.gray('┌─' + '─'.repeat(80) + '┐'));
		
		for (let i = 0; i < sortedLinks.length; i++) {
			const link = sortedLinks[i];
			const isLast = i === sortedLinks.length - 1;
			const prefix = isLast ? '└─' : '├─';
			const icon = link.type === 'image' ? '🖼️ ' : '🔗 ';
			
			console.log(chalk.gray('│ ') + chalk.red(`${prefix} ${icon}${link.link}`));
		}
		
		console.log(chalk.gray('└─' + '─'.repeat(80) + '┘'));
		console.log();
	}
};
