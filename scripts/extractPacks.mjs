#!/usr/bin/env node

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as p from "@clack/prompts";
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { yellow } from "kolorist";
// import moduleJSON from "../module.json" with { type: "json" };

const foundryDataDir = "packs/";
const jsonDataDir = "data/";

p.intro(`Extracting ${foundryDataDir} into ${jsonDataDir}...`)

const outDir = path.resolve(process.cwd());
const packsCompiled = path.resolve(outDir, foundryDataDir);
if (!existsSync(packsCompiled)) {
	p.log.warn("Packs directory does not exist in the build!")
}

const packFolders = await fs.readdir(packsCompiled);

if (packFolders.length === 0) p.log.info("No packs to extract!")

await p.tasks(
	packFolders.map(pack => ({
		title: `Extracting ${pack}...`,
		task: async () => {
			if (!existsSync(`${jsonDataDir}/${pack}`)) {
				await fs.mkdir(`${jsonDataDir}/${pack}`);
			}
			await extractPack(
				path.resolve(packsCompiled, pack),
				`${jsonDataDir}/${pack}`,
				{
					expandAdventures: true,
					omitVolatile: true,
					folders: true,
					clean: true,
					log: false,
					transformEntry: (e, ctx) => void 0,
					jsonOptions: {
						replacer: null,
						space: "\t"
					}
				},
			);
			return `Extracted ${yellow(pack)}!`
		}
	})),
	{}
);

p.outro("Finished!");