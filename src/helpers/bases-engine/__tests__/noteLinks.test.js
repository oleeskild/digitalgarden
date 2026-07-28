import { describe, it, expect } from "vitest";
import {
	parseWikilink,
	createNoteIndex,
	wikilinkDisplayTitle,
} from "../noteLinks.js";

const notes = [
	{
		path: "06 Assets/Lyrics/Artists/David Berman.md",
		url: "/06 Assets/Lyrics/Artists/David Berman/",
		metadata: { "dg-note-properties": { title: "David Berman" } },
	},
	{
		path: "Albums/Bright Flight.md",
		url: "/Albums/Bright Flight/",
		metadata: {},
	},
	{
		path: "Deep/Nested/Bright Flight.md",
		url: "/Deep/Nested/Bright Flight/",
		metadata: {},
	},
];

describe("parseWikilink", () => {
	it("parses target, heading and alias", () => {
		expect(parseWikilink("[[Note#Heading|Label]]")).toEqual({
			target: "Note",
			heading: "Heading",
			alias: "Label",
		});
	});

	it("parses a bare link and accepts an embed marker", () => {
		expect(parseWikilink("![[Note]]")).toEqual({
			target: "Note",
			heading: null,
			alias: null,
		});
	});

	it("returns null for non-wikilinks", () => {
		expect(parseWikilink("plain")).toBe(null);
		expect(parseWikilink(42)).toBe(null);
		expect(parseWikilink(null)).toBe(null);
	});

	it("treats an escaped pipe as the alias separator (legacy healed frontmatter)", () => {
		expect(parseWikilink("[[Artists/David Berman\\|Dave]]")).toEqual({
			target: "Artists/David Berman",
			heading: null,
			alias: "Dave",
		});
	});
});

describe("createNoteIndex", () => {
	const index = createNoteIndex(notes);

	it("resolves a full vault path without .md exactly", () => {
		expect(
			index.resolve("06 Assets/Lyrics/Artists/David Berman").url,
		).toBe("/06 Assets/Lyrics/Artists/David Berman/");
	});

	it("resolves a full vault path with .md exactly", () => {
		expect(
			index.resolve("06 Assets/Lyrics/Artists/David Berman.md").url,
		).toBe("/06 Assets/Lyrics/Artists/David Berman/");
	});

	it("falls back to shortest-path matching for bare names", () => {
		expect(index.resolve("Bright Flight").path).toBe(
			"Albums/Bright Flight.md",
		);
	});

	it("matches partial subpaths at a / boundary only", () => {
		expect(index.resolve("Nested/Bright Flight").path).toBe(
			"Deep/Nested/Bright Flight.md",
		);
		expect(index.resolve("light")).toBe(null);
	});

	it("is case-insensitive", () => {
		expect(index.resolve("david berman")).not.toBe(null);
	});

	it("uses the title property, falling back to the filename", () => {
		expect(index.resolve("David Berman").title).toBe("David Berman");
		expect(index.resolve("Bright Flight").title).toBe("Bright Flight");
	});

	it("returns null for unknown targets", () => {
		expect(index.resolve("Nope")).toBe(null);
	});

	it("falls back to shortest-path matching for bare names with a .md suffix", () => {
		expect(index.resolve("Bright Flight.md").path).toBe(
			"Albums/Bright Flight.md",
		);
	});
});

describe("wikilinkDisplayTitle", () => {
	const index = createNoteIndex(notes);

	it("prefers the alias", () => {
		expect(wikilinkDisplayTitle("[[David Berman|Dave]]", index)).toBe(
			"Dave",
		);
	});

	it("uses the resolved title", () => {
		expect(wikilinkDisplayTitle("[[David Berman]]", index)).toBe(
			"David Berman",
		);
	});

	it("falls back to the target basename for dead links", () => {
		expect(wikilinkDisplayTitle("[[Some/Missing Note]]", index)).toBe(
			"Missing Note",
		);
	});

	it("returns null for non-wikilinks", () => {
		expect(wikilinkDisplayTitle("plain", index)).toBe(null);
	});

	it("prefers the alias for a legacy escaped-pipe wikilink and still resolves the target", () => {
		expect(
			wikilinkDisplayTitle("[[Albums/Bright Flight\\|BF]]", index),
		).toBe("BF");
	});
});
