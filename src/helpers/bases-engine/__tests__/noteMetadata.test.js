import { describe, it, expect } from "vitest";
import { pickNoteMetadata } from "../noteMetadata.js";

// Regression test for github.com/oleeskild/obsidian-digital-garden/issues/816:
// basesNotes carried the full Eleventy data cascade as note metadata, so
// auto-detected columns included pkg, collections, basesNotes, settings, etc.
describe("pickNoteMetadata", () => {
	const cascadeData = {
		// Real note frontmatter
		"dg-note-properties": { author: "Orwell", year: 1949 },
		tags: ["book"],
		title: "1984",
		created: "2026-01-01T00:00:00Z",
		updated: "2026-02-01T00:00:00Z",
		// Legacy top-level user property (pre-nesting plugin versions)
		author: "Orwell",
		// Eleventy data cascade internals that must not leak
		pkg: { name: "site" },
		layout: "layouts/note.njk",
		permalink: "/notes/1984/",
		page: { url: "/notes/1984/" },
		collections: { note: [] },
		eleventyComputed: {},
		basesNotes: [{ path: "x" }],
		settings: { dgShowBacklinks: true },
		graph: { nodes: {} },
		filetree: {},
		userComputed: {},
		noteProps: {},
		dynamics: {},
		meta: {},
		content: "<p>hi</p>",
	};

	it("keeps note properties and published frontmatter", () => {
		const picked = pickNoteMetadata(cascadeData);
		expect(picked["dg-note-properties"]).toEqual({
			author: "Orwell",
			year: 1949,
		});
		expect(picked.tags).toEqual(["book"]);
		expect(picked.title).toBe("1984");
		expect(picked.created).toBe("2026-01-01T00:00:00Z");
		expect(picked.updated).toBe("2026-02-01T00:00:00Z");
	});

	it("keeps legacy top-level user properties", () => {
		expect(pickNoteMetadata(cascadeData).author).toBe("Orwell");
	});

	it("drops Eleventy data cascade internals", () => {
		const picked = pickNoteMetadata(cascadeData);
		for (const key of [
			"pkg",
			"layout",
			"permalink",
			"page",
			"collections",
			"eleventyComputed",
			"basesNotes",
			"settings",
			"graph",
			"filetree",
			"userComputed",
			"noteProps",
			"dynamics",
			"meta",
			"content",
		]) {
			expect(picked).not.toHaveProperty(key);
		}
	});

	it("handles missing data", () => {
		expect(pickNoteMetadata(null)).toEqual({});
		expect(pickNoteMetadata(undefined)).toEqual({});
	});
});
