import type { UserConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import vttSync from "foundryvtt-sync/vite";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import moduleJSON from "./module.json" with { type: "json" };
import "dotenv/config";

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
	if (command === "serve")
		console.log(`Running foundry port ${foundryPort} -> dev port ${devPort}`);
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
				entry: `./${libEntry}`,
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
				name: "foundryvtt-stubs", // Create dummy files for Foundry's tests to pass
				apply: "serve",
				buildStart() {
					if (!fs.existsSync("dist"))
						fs.mkdirSync("dist");

					const files = [...moduleJSON.esmodules, ...moduleJSON.styles];
					for (const name of files) {
						fs.writeFileSync(name, "", { flag: "a" });
					}
				},
				configureServer(server) {
					const stylePaths = new Set(moduleJSON.styles.map(s => `/${PACKAGE_ID}/${s}`));
					server.middlewares.use((req, res, next) => {
						if (req.url && stylePaths.has(req.url.split("?")[0])) {
							res.setHeader("Content-Type", "text/css");
							res.end("");
							return;
						}
						next();
					});
				},
			},
			{
				name: "save-triggers", // Saves triggers live from server in dev mode
				apply: "serve",
				configureServer(server) {
					server.ws.on("trigger-animations:save", (payload, client) => {
						const triggers = (payload as { triggers?: unknown })?.triggers;
						const subdir = (payload as { subdir?: string })?.subdir || "anim-trigger";

						if (!Array.isArray(triggers)) {
							client.send("trigger-animations:saved", { error: "Expected an array of triggers." });
							return;
						}

						const outDir = path.resolve(__dirname, "static", subdir);
						try {
							fs.mkdirSync(outDir, { recursive: true });

							const used = new Set<string>();
							const writtenNames = new Set<string>();
							for (const [index, trigger] of triggers.entries()) {
								let base = slugify((trigger as { name?: unknown })?.name);
								// Disambiguate collisions with the trigger id, then a running index.
								if (used.has(base))
									base = `${base}-${(trigger as { id?: unknown })?.id ?? index}`;
								while (used.has(base)) base = `${base}-${index}`;
								used.add(base);

								const fileName = `${base}.json`;
								fs.writeFileSync(
									path.join(outDir, fileName),
									JSON.stringify(purgeObject(trigger) ?? {}, null, "\t"),
								);
								writtenNames.add(fileName);
							}

							let deleted = 0;
							const trashDir = path.resolve(__dirname, "static", "_deleted", subdir);
							for (const name of fs.readdirSync(outDir)) {
								if (!name.endsWith(".json") || writtenNames.has(name))
									continue;
								fs.mkdirSync(trashDir, { recursive: true });
								const dest = path.join(trashDir, name);
								// rename can't clobber on Windows; let the latest deletion win.
								fs.rmSync(dest, { force: true });
								fs.renameSync(path.join(outDir, name), dest);
								deleted++;
							}

							const written = writtenNames.size;
							const tail = deleted ? `, moved ${deleted} to _deleted` : "";
							console.log(`[save-triggers] Wrote ${written} trigger(s) to static/${subdir}${tail}.`);
							client.send("trigger-animations:saved", { written, deleted, subdir });
						} catch (error) {
							console.error("[save-triggers]", error);
							client.send("trigger-animations:saved", { error: (error as Error).message });
						}
					});
				},
			},
		],
	} satisfies UserConfig;
});

// Mirrors `scripts/unpackTriggers.mjs`
function slugify(name: unknown): string {
	return (
		String(name || "trigger")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "trigger"
	);
}

function purgeObject(value: unknown): unknown {
	if (Array.isArray(value)) {
		const next = value.map(purgeObject).filter(v => v != null);
		return next.length ? next : undefined;
	}
	if (value && typeof value === "object") {
		const next: Record<string, unknown> = {};
		for (const [key, v] of Object.entries(value)) {
			const purged = purgeObject(v);
			if (purged != null)
				next[key] = purged;
		}
		return Object.keys(next).length ? next : undefined;
	}
	return value === "" ? undefined : value;
}
