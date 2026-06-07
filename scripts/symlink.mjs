import { lstatSync, rmSync, symlinkSync, unlinkSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import process from "node:process";
import * as p from "@clack/prompts";
import moduleJSON from "../module.json" with { type: "json" };
import { yellow } from "kolorist";

p.intro(`${moduleJSON.id} symlink script`)

// Store config in user's home directory
const configPath = resolve(homedir(), ".foundry-symlink-config.json");

// Load last known path from config
let lastPath = null;
try {
	const config = JSON.parse(readFileSync(configPath, "utf-8"));
	lastPath = config.dataPath;
} catch {
	// Config doesn't exist yet, that's fine
}

const windowsInstructions = process.platform === "win32" ? " Start with a drive letter (\"C:\\\")." : "";
const lastFolder = lastPath ? `(last: ${lastPath})` : "";
const promptPath = await p.text({
	message: `Enter the full path to your Foundry data folder.${windowsInstructions}`,
	placeholder: lastPath,
	initialValue: lastPath,
	validate(val) {
		const value = val.replace(/\W*$/, "").trim();
		if (!value || !/\bData$/.test(value)) {
			return (`"${value}" does not contain ${yellow('/Data')}`);
		}
	}
});

let dataPath = promptPath.replace(/\W*$/, "").trim();

if (dataPath !== lastPath) {
	// Ask if user wants to save the path
	const shouldSave = await p.confirm({
		initialValue: true,
		message: `Save "${dataPath}" for future use?`,
	});

	if (shouldSave) {
		writeFileSync(configPath, JSON.stringify({ dataPath }, null, 2));
	}
}

const symlinkPath = resolve(dataPath, "modules", moduleJSON.id);
const symlinkStats = lstatSync(symlinkPath, { throwIfNoEntry: false });
if (symlinkStats) {
	const atPath = symlinkStats.isDirectory() ? "folder" : symlinkStats.isSymbolicLink() ? "symlink" : "file";
	const proceed = await p.confirm({
		initialValue: false,
		message: `A "${moduleJSON.id}" ${atPath} already exists in the "modules" subfolder. Replace with new symlink?`,
	});
	if (!proceed) {
		p.cancel("Aborting.");
		process.exit(0);
	}
}

try {
	if (symlinkStats?.isDirectory()) {
		rmSync(symlinkPath, { recursive: true, force: true });
	} else if (symlinkStats) {
		unlinkSync(symlinkPath);
	}
	symlinkSync(resolve(process.cwd()), symlinkPath);
} catch (error) {
	if (error instanceof Error) {
		console.error(`An error was encountered trying to create a symlink: ${error.message}`);
		process.exit(1);
	}
}

p.outro(`Symlink successfully created at "${symlinkPath}"!`);