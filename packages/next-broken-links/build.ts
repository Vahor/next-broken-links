import type { BuildConfig } from "bun";

const defaultBuildConfig: BuildConfig = {
	target: "node",
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	packages: "external",
};

const addShebang = async (code: string) =>
	`#!/usr/bin/env node\n${await Bun.file(code).text()}`;

await Promise.all([
	Bun.build({
		...defaultBuildConfig,
		format: "esm",
		naming: "[dir]/[name].js",
	}),
]);
await Bun.write("dist/index.js", await addShebang("./dist/index.js"));
