import type { Plugin, UserConfig } from "vite";
import path from "node:path";
import fs from 'node:fs';
import vttSync from "foundryvtt-sync/vite";
import { defineConfig } from "vite";
import moduleJSON from "./module.json" with { type: "json" };
import postcssPresetEnv from "postcss-preset-env";
import 'dotenv/config'

const target = "esnext"; // Build target for the final bundle.
const foundryPort = Number(process.env.FOUNDRY_PORT || 30000); // Which port your FoundryVTT instance is hosted at.
const devPort = Number(process.env.DEV_PORT || 30001); // Which port you want to use for development.
const libEntry = "index.ts"; // The main entry file to begin crawling from (root being `src/`).

const postcss = {
	inject: false,
	sourceMap: true,
	extensions: [".css"],
	plugins: [postcssPresetEnv],
};

const PACKAGE_ID = `modules/${moduleJSON.id}`;


export default defineConfig(({ command }) => {
	if (command === 'serve') console.log(`Running foundry port ${foundryPort} -> dev port ${devPort}`);
	return {
		root: "src/", // Source location / esbuild root.
		base: `/${PACKAGE_ID}/dist`, // Base module path.
		publicDir: false, // No public resources to copy.
		cacheDir: "../.vite-cache", // Relative from root directory.

		resolve: {
			conditions: ["browser", "import", "default"], // Only use browser-compatible exports from node modules.
			alias: {
				$lib: path.resolve(__dirname, "./src/lib"),
				moduleJSON: path.resolve(__dirname, "./module.json"),
				// Modify also the tsconfig.json file to include the alias
			},
		},

		esbuild: { target }, // https://esbuild.github.io/api/#transform

		css: { postcss }, // https://vite.dev/config/shared-options#css-postcss

		server: {
			port: devPort,
			open: "/game",
			proxy: {
				// Serves static files from main Foundry server.
				[`^(/${PACKAGE_ID}/(assets|lang|packs|static|.*\.json$))`]: `http://localhost:${foundryPort}`,

				// All other paths besides package ID path are served from main Foundry server.
				[`^(?!/${PACKAGE_ID}/)`]: `http://localhost:${foundryPort}`,

				// Rewrite incoming `module-id.js` request from Foundry to the dev server libEntry.
				[`/${PACKAGE_ID}/dist/${moduleJSON.id}.js`]: {
					target: `http://localhost:${devPort}/${PACKAGE_ID}/dist`,
					rewrite: () => libEntry,
				},

				// Enable socket.io from main Foundry server.
				"/socket.io": { target: `ws://localhost:${foundryPort}`, ws: true },
			},
		},
		build: {
			outDir: "../dist", // The output directory.
			emptyOutDir: true,
			sourcemap: true, // Provide a publicly available sourcemap for debugging purposes.
			target,
			minify: "terser",
			terserOptions: {
				keep_classnames: true, // Don't mangle class names since Foundry relies on them
			},
			lib: {
				entry: "./" + libEntry,
				formats: ["es"],
				fileName: moduleJSON.id,
			},
			rollupOptions: {
				output: {
					// Rewrite the default style.css to a more recognizable file name.
					assetFileNames: assetInfo =>
						assetInfo.name === "style.css" ? `${moduleJSON.id}.css` : assetInfo.name as string,
				},
			},
		},

		plugins: [
			vttSync(moduleJSON, { ignoreAdventureHMR: true }), // Build the database from JSON files on build
			{
				name: 'foundryvtt-stubs', // Create dummy files for Foundry's tests to pass
				apply: 'serve',
				buildStart() {
					if (!fs.existsSync('dist')) fs.mkdirSync('dist');

					const files = [...moduleJSON.esmodules, ...moduleJSON.styles];
					for (const name of files) {
						fs.writeFileSync(name, '', { flag: 'a' });
					}
				},
				configureServer(server) {
					const stylePaths = new Set(moduleJSON.styles.map(s => `/${PACKAGE_ID}/${s}`));
					server.middlewares.use((req, res, next) => {
						if (req.url && stylePaths.has(req.url.split('?')[0])) {
							res.setHeader('Content-Type', 'text/css');
							res.end('');
							return;
						}
						next();
					});
				},
			},
		],
	} satisfies UserConfig;
});