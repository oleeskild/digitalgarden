import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Template updates only touch files explicitly listed in plugin-info.json.
// A first-party plugin file that is missing from filesToModify would
// silently never reach existing gardens on update.

const repoRoot = path.join(__dirname, "..", "..", "..");
const pluginInfo = JSON.parse(
	fs.readFileSync(path.join(repoRoot, "plugin-info.json"), "utf8")
);

const listFiles = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? listFiles(path.join(dir, entry.name))
			: [path.join(dir, entry.name)]
	);

describe("plugin-info.json", () => {
	it("lists every first-party (dg-*) plugin file in filesToModify", () => {
		const pluginsRoot = path.join(repoRoot, "src", "plugins");
		const firstPartyDirs = fs
			.readdirSync(pluginsRoot)
			.filter((name) => name.startsWith("dg-"));
		const files = firstPartyDirs.flatMap((dir) =>
			listFiles(path.join(pluginsRoot, dir)).map((f) =>
				path.relative(repoRoot, f).split(path.sep).join("/")
			)
		);
		expect(files.length).toBeGreaterThan(0);
		for (const file of files) {
			expect(pluginInfo.filesToModify).toContain(file);
		}
	});

	it("never lists the user-owned plugin registry", () => {
		const all = [
			...pluginInfo.filesToDelete,
			...pluginInfo.filesToAdd,
			...pluginInfo.filesToModify,
		];
		expect(all).not.toContain("src/plugins/plugins.json");
	});

	it("has no file in more than one list", () => {
		const lists = {
			filesToDelete: pluginInfo.filesToDelete,
			filesToAdd: pluginInfo.filesToAdd,
			filesToModify: pluginInfo.filesToModify,
		};
		const seen = new Map();
		for (const [listName, files] of Object.entries(lists)) {
			for (const file of files) {
				expect(
					seen.has(file),
					`${file} appears in both ${seen.get(file)} and ${listName}`
				).toBe(false);
				seen.set(file, listName);
			}
		}
	});
});
