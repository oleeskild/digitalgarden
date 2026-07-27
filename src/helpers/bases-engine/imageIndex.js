/**
 * Index of published image files (under src/site/img/user) used to resolve
 * Obsidian "shortest path" wikilinks like [[cover.jpg]] to the file's real
 * location, the way Obsidian resolves them against the vault.
 */

const fs = require("fs");
const path = require("path");

/**
 * Build an index over a list of image paths (relative to the image root,
 * using "/" separators).
 *
 * resolve(linkpath) matches case-insensitively:
 *  - an exact relative path, or
 *  - any path whose trailing segments equal the linkpath ("Covers/a.jpg"
 *    matches "06 Assets/Covers/a.jpg" but "ter.jpg" never matches
 *    "Water.jpg").
 * When several files match, the shortest path wins (ties broken
 * alphabetically). Returns the indexed path in its real casing, or null.
 */
function createImageIndex(paths) {
	const byBasename = new Map();

	for (const p of paths) {
		const basename = p.split("/").pop().toLowerCase();
		if (!byBasename.has(basename)) byBasename.set(basename, []);
		byBasename.get(basename).push(p);
	}

	return {
		resolve(linkpath) {
			const normalized = linkpath.toLowerCase();
			const basename = normalized.split("/").pop();
			const candidates = byBasename.get(basename);
			if (!candidates) return null;

			const matches = candidates.filter((p) => {
				const lower = p.toLowerCase();

				return (
					lower === normalized || lower.endsWith("/" + normalized)
				);
			});
			if (matches.length === 0) return null;

			matches.sort(
				(a, b) => a.length - b.length || a.localeCompare(b),
			);

			return matches[0];
		},
	};
}

/**
 * Recursively list all files under rootDir as "/"-separated paths relative
 * to rootDir. Returns [] when the directory does not exist.
 */
function scanImageDir(rootDir) {
	const results = [];

	const walk = (dir, prefix) => {
		let entries;

		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const rel = prefix ? prefix + "/" + entry.name : entry.name;

			if (entry.isDirectory()) {
				walk(path.join(dir, entry.name), rel);
			} else if (entry.isFile()) {
				results.push(rel);
			}
		}
	};

	walk(rootDir, "");

	return results;
}

module.exports = { createImageIndex, scanImageDir };
