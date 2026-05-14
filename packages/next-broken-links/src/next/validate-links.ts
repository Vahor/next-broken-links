import type { Links } from "./extract";

export interface BrokenLink {
	file: string;
	link: string;
	type: "link" | "image";
}

interface ValidationConfig {
	basePath?: string;
	trailingSlash?: boolean;
}

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const withLeadingSlash = (path: string) =>
	path.startsWith("/") ? path : `/${path}`;

const withoutTrailingSlash = (path: string) => {
	if (path === "/") return path;
	return path.replace(/\/+$/, "");
};

const normalizeBasePath = (basePath: string | undefined) => {
	if (!basePath || basePath === "/") return undefined;
	return withoutTrailingSlash(withLeadingSlash(basePath));
};

export const normalizeLinkToPath = (
	link: string,
	config?: ValidationConfig,
): string | undefined => {
	const value = link.trim();
	if (!value || value.startsWith("#")) return undefined;

	let pathname: string;
	try {
		if (value.startsWith("//")) {
			pathname = new URL(`https:${value}`).pathname;
		} else if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
			const url = new URL(value);
			if (!HTTP_PROTOCOLS.has(url.protocol)) return undefined;
			pathname = url.pathname;
		} else {
			pathname = new URL(value, "https://next-broken-links.local").pathname;
		}
	} catch (_e) {
		return undefined;
	}

	const basePath = normalizeBasePath(config?.basePath);
	if (
		basePath &&
		(pathname === basePath || pathname.startsWith(`${basePath}/`))
	) {
		pathname = pathname.slice(basePath.length) || "/";
	}

	return withoutTrailingSlash(withLeadingSlash(pathname));
};

const normalizeOutputFilePath = (filePath: string) =>
	withLeadingSlash(filePath.replaceAll("\\", "/").replace(/^\/+/, ""));

const createPathSet = (files: Links[], config?: ValidationConfig) => {
	const paths = new Set<string>();
	const basePath = normalizeBasePath(config?.basePath);

	for (const file of files) {
		const path = normalizeOutputFilePath(file.file);
		paths.add(path);
		if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
			paths.add(path.slice(basePath.length) || "/");
		}
	}

	for (const path of Array.from(paths)) {
		if (path === "/index.html") {
			paths.add("/");
		}

		if (path.endsWith("/index.html")) {
			paths.add(
				withoutTrailingSlash(path.slice(0, -"/index.html".length) || "/"),
			);
		}

		if (path.endsWith(".html")) {
			paths.add(path.slice(0, -".html".length) || "/");
		}

		if (path === "/page.js") {
			paths.add("/");
		} else if (path.endsWith("/page.js")) {
			paths.add(withoutTrailingSlash(path.slice(0, -"/page.js".length)));
		}

		if (path.endsWith(".xml.body")) {
			paths.add(path.slice(0, -".body".length));
		}
	}

	return paths;
};

const getCandidatePaths = (path: string, config?: ValidationConfig) => {
	const candidates = new Set([path]);
	const preferDirectory = config?.trailingSlash === true;

	if (path === "/") {
		candidates.add("/index.html");
		candidates.add("/page.js");
		return candidates;
	}

	const fileCandidates = [
		`${path}.html`,
		`${path}/index.html`,
		`${path}/page.js`,
	];
	if (preferDirectory) {
		fileCandidates.reverse();
	}

	for (const candidate of fileCandidates) {
		candidates.add(candidate);
	}

	if (path.endsWith(".xml")) {
		candidates.add(`${path}.body`);
	}

	return candidates;
};

const hasExistingPath = (
	existingPaths: Set<string>,
	path: string,
	config?: ValidationConfig,
) => {
	for (const candidate of getCandidatePaths(path, config)) {
		if (existingPaths.has(candidate)) return true;
	}
	return false;
};

export const checkValidLinks = async (
	files: Links[],
	config?: ValidationConfig,
) => {
	const result: BrokenLink[] = [];
	const existingPaths = createPathSet(files, config);

	for (const file of files) {
		for (const link of file.links) {
			const path = normalizeLinkToPath(link.value, config);
			if (!path) continue;

			if (!hasExistingPath(existingPaths, path, config)) {
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
