/**
 * Wikilink parsing and note-target resolution for the bases engine.
 * Values published by plugin >= 2.81 carry full vault paths (exact
 * match); older publishes carry Obsidian "shortest path" names, resolved
 * by suffix matching against the published notes.
 */

// Index cached per notes array — the same array is reused across every
// base block in a build.
const indexCache = new WeakMap();

function parseWikilink(value) {
	if (typeof value !== "string") return null;
	const match = value.trim().match(/^!?\[\[([^\]]+)\]\]$/);
	if (!match) return null;

	let inner = match[1];
	let alias = null;
	const pipe = inner.indexOf("|");
	if (pipe !== -1) {
		alias = inner.slice(pipe + 1).trim() || null;
		inner = inner.slice(0, pipe).replace(/\\$/, "");
	}

	let heading = null;
	const hash = inner.indexOf("#");
	if (hash !== -1) {
		heading = inner.slice(hash + 1).trim() || null;
		inner = inner.slice(0, hash);
	}

	return { target: inner.trim(), heading, alias };
}

function noteTitle(note) {
	const fromMeta =
		note.metadata &&
		(note.metadata.title ||
			(note.metadata["dg-note-properties"] &&
				note.metadata["dg-note-properties"].title));
	if (fromMeta) return String(fromMeta);
	return note.path.split("/").pop().replace(/\.md$/i, "");
}

function createNoteIndex(notes) {
	const list = Array.isArray(notes) ? notes : [];
	if (indexCache.has(list)) return indexCache.get(list);

	const exact = new Map();
	const byBasename = new Map();

	for (const note of list) {
		if (!note || !note.path || !note.url) continue;
		const entry = { url: note.url, title: noteTitle(note), path: note.path };
		const lower = note.path.toLowerCase();
		const lowerNoExt = lower.replace(/\.md$/, "");
		exact.set(lower, entry);
		exact.set(lowerNoExt, entry);

		const basename = lowerNoExt.split("/").pop();
		if (!byBasename.has(basename)) byBasename.set(basename, []);
		byBasename.get(basename).push(entry);
	}

	const index = {
		resolve(target) {
			const normalized = String(target)
				.toLowerCase()
				.replace(/\.md$/i, "");
			const exactHit = exact.get(normalized);
			if (exactHit) return exactHit;

			const candidates = byBasename.get(normalized.split("/").pop());
			if (!candidates) return null;

			const matches = candidates.filter((entry) => {
				const p = entry.path.toLowerCase().replace(/\.md$/, "");
				return p === normalized || p.endsWith("/" + normalized);
			});
			if (matches.length === 0) return null;

			matches.sort(
				(a, b) =>
					a.path.length - b.path.length ||
					a.path.localeCompare(b.path),
			);
			return matches[0];
		},
	};

	indexCache.set(list, index);
	return index;
}

function wikilinkDisplayTitle(value, index) {
	const link = parseWikilink(value);
	if (!link) return null;
	if (link.alias) return link.alias;
	const resolved = index ? index.resolve(link.target) : null;
	if (resolved) return resolved.title;
	return link.target.split("/").pop();
}

module.exports = { parseWikilink, createNoteIndex, wikilinkDisplayTitle };
