#!/usr/bin/env node

/**
 * Unpack a trigger bundle.
 *
 * Usage:
 *   node scripts/unpackTriggers.mjs                    # interactive
 *   node scripts/unpackTriggers.mjs <bundle> [outDir]  # skip the prompts
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";
import { green, yellow } from "kolorist";

const staticDir = path.resolve(process.cwd(), "static");

p.intro("Unpacking trigger bundle");

// 1. Which bundle? — passed as an argument or picked from static/*.json.
let bundlePath = process.argv[2];

if (!bundlePath) {
	const entries = existsSync(staticDir)
		? await fs.readdir(staticDir, { withFileTypes: true })
		: [];
	const bundles = entries
		.filter((e) => e.isFile() && e.name.endsWith(".json"))
		.map((e) => e.name);

	if (bundles.length === 0) {
		p.cancel("No .json bundles found in static/.");
		process.exit(1);
	}

	const picked = await p.select({
		message: "Which bundle do you want to unpack?",
		options: bundles.map((name) => ({ value: path.join(staticDir, name), label: name })),
	});

	if (p.isCancel(picked)) {
		p.cancel("Cancelled.");
		process.exit(0);
	}

	bundlePath = picked;
} else {
	bundlePath = path.resolve(process.cwd(), bundlePath);
}

if (!existsSync(bundlePath)) {
	p.cancel(`Bundle ${yellow(bundlePath)} does not exist!`);
	process.exit(1);
}

// 2. Read and validate the bundle.
let triggers;
try {
	triggers = JSON.parse(await fs.readFile(bundlePath, "utf8"));
} catch (error) {
	p.cancel(`Could not parse ${yellow(bundlePath)}: ${error.message}`);
	process.exit(1);
}

if (!Array.isArray(triggers)) {
	p.cancel("Bundle is not an array of triggers.");
	process.exit(1);
}

// 3. Where to extract? — default to a subdir named after the bundle.
const defaultDir = path.join(
	staticDir,
	path.basename(bundlePath, path.extname(bundlePath)),
);

let outDir = process.argv[3];
if (!outDir) {
	const answer = await p.text({
		message: "Which folder should the triggers be extracted to?",
		placeholder: path.relative(process.cwd(), defaultDir),
		defaultValue: path.relative(process.cwd(), defaultDir),
	});

	if (p.isCancel(answer)) {
		p.cancel("Cancelled.");
		process.exit(0);
	}

	outDir = answer;
}

outDir = path.resolve(process.cwd(), outDir);

// Guard against silently overwriting an existing, non-empty folder.
if (existsSync(outDir)) {
	const existing = (await fs.readdir(outDir)).filter((f) => f.endsWith(".json"));
	if (existing.length > 0) {
		const proceed = await p.confirm({
			message: `${yellow(path.relative(process.cwd(), outDir))} already has ${existing.length} .json file(s). Continue?`,
		});
		if (p.isCancel(proceed) || !proceed) {
			p.cancel("Cancelled.");
			process.exit(0);
		}
	}
}

await fs.mkdir(outDir, { recursive: true });

/**
 * Turn a trigger's name into a filesystem-friendly slug.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
	return (
		String(name || "trigger")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "trigger"
	);
}

// 4. Write one file per trigger, keeping names unique.
const used = new Set();
let written = 0;

await p.tasks(
	triggers.map((trigger, index) => {
		let base = slugify(trigger?.name);
		// Disambiguate collisions with the trigger id, then a running index.
		if (used.has(base)) base = `${base}-${trigger?.id ?? index}`;
		while (used.has(base)) base = `${base}-${index}`;
		used.add(base);

		const fileName = `${base}.json`;
		return {
			title: `Writing ${fileName}...`,
			task: async () => {
				await fs.writeFile(path.join(outDir, fileName), JSON.stringify(trigger, null, "\t"));
				written++;
				return `Wrote ${yellow(fileName)}`;
			},
		};
	}),
	{},
);

p.outro(
	`Unpacked ${green(written)} trigger(s) into ${yellow(path.relative(process.cwd(), outDir))}.`,
);
