import { defineConfig } from "tsdown";

export default defineConfig({
	target: ["es2020"],
	platform: "node",
	entry: ["./src/index.ts"],
	outDir: "./dist",
	clean: true,
	minify: false,
	sourcemap: false,
	fixedExtension: false,
	hash: false,
	dts: {
		sourcemap: false,
	},
	format: "esm",
	deps: {
		onlyBundle: [],
	},
});
