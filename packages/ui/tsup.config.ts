import path from "node:path";
import { glob } from "glob";
import { defineConfig } from "tsup";

/**
 * Auto-discover all component entry points
 * Looks for src/ComponentName/ComponentName.ts files where the folder name matches the file name
 */
const allFiles = glob.sync("src/**/[A-Z]*.ts", {
	ignore: [
		"**/*.test.ts",
		"**/*.stories.ts",
		"**/types.ts",
		"**/tokens.ts",
		"**/variants.ts",
		"**/index.ts",
		"src/test-setup.ts",
		"src/tokens/**",
		"src/system/**",
	],
});

// Filter to only include files where the folder name matches the file name
// e.g., src/Button/Button.ts is included, but src/Button/helpers.ts is not
const entries = allFiles.filter((file) => {
	const dir = path.dirname(file);
	const folderName = path.basename(dir);
	const fileName = path.basename(file, ".ts");
	return folderName === fileName;
});

export default defineConfig({
	entry: entries,
	format: ["esm"],
	dts: true,
	clean: true,
	treeshake: true,
	splitting: false,
	external: ["react", "react-dom"],
	esbuildOptions(options) {
		options.jsx = "automatic";
	},
});
