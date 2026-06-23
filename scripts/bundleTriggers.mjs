#!/usr/bin/env node

/**
 * Bundle triggers.
 *
 * Usage:
 *   node scripts/bundleTriggers.mjs            # bundle every subdir of static/
 *   node scripts/bundleTriggers.mjs <dir>      # use a different source root
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";
import { green, yellow } from "kolorist";

const sourceRoot = process.argv[2] || "static";

p.intro(`Bundling triggers from ${yellow(sourceRoot)}/*`);

const rootDir = path.resolve(process.cwd(), sourceRoot);
if (!existsSync(rootDir)) {
	p.cancel(`Source directory ${yellow(sourceRoot)} does not exist!`);
	process.exit(1);
}

const distDir = path.resolve(process.cwd(), "dist");
await fs.mkdir(distDir, { recursive: true });

async function getTriggerFiles(dir) {
	const files = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await getTriggerFiles(fullPath)));
		} else if (entry.isFile() && entry.name.endsWith(".json")) {
			files.push(fullPath);
		}
	}

	return files;
}

// Only subdirectories of the source root become bundles.
// Skip those prefixed with "_" (e.g. _deleted), which hold non-bundled files.
const rootEntries = await fs.readdir(rootDir, { withFileTypes: true });
const subdirs = rootEntries
	.filter((e) => e.isDirectory() && !e.name.startsWith("_"))
	.map((e) => e.name);

if (subdirs.length === 0) {
	p.cancel(`No subdirectories found in ${yellow(sourceRoot)} to bundle.`);
	process.exit(1);
}

let bundled = 0;

await p.tasks(
	subdirs.map((subdir) => ({
		title: `Bundling ${subdir}...`,
		task: async () => {
			const subdirPath = path.join(rootDir, subdir);
			const files = await getTriggerFiles(subdirPath);
			const triggers = [];

			for (const file of files) {
				try {
					const data = JSON.parse(await fs.readFile(file, "utf8"));
					if (Array.isArray(data)) {
						triggers.push(...data);
					} else if (data && typeof data === "object" && data.nodes) {
						triggers.push(data);
					} else {
						p.log.warn(`Skipping ${path.relative(rootDir, file)}: not a trigger`);
					}
				} catch (error) {
					p.log.error(`Error reading ${path.relative(rootDir, file)}: ${error.message}`);
				}
			}

			if (triggers.length === 0) {
				return `No triggers in ${yellow(subdir)}, skipped`;
			}

			const outFile = path.join(distDir, `${subdir}.json`);
			await fs.writeFile(outFile, JSON.stringify(triggers));
			bundled++;
			return `Bundled ${green(triggers.length)} trigger(s) into ${yellow(`dist/${subdir}.json`)}`;
		},
	})),
	{},
);

p.outro(bundled > 0 ? `Bundled ${green(bundled)} file(s).` : "Nothing to bundle.");
