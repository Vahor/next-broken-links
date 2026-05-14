import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(projectRoot, "../..");

const nextConfig: NextConfig = {
	output: "export",
	turbopack: {
		root: workspaceRoot,
	},

	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
