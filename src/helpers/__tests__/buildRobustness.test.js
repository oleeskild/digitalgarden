import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { describe, it, expect, afterEach } from "vitest";

const require = createRequire(import.meta.url);
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const sharp = require("sharp");
const { namedHeadingsFilter } = require("../utils");
const normalizeFavicon = require("../../site/normalize-favicon");
const frontPage = require("../../site/index.11tydata");

describe("fallback front page", () => {
	it("sorts notes whose frontmatter title isn't a string", () => {
		const note = (title, fileSlug) => ({
			url: `/${fileSlug}/`,
			fileSlug,
			data: { "dg-publish": true, title },
		});
		const notes = frontPage.eleventyComputed.publishedNotes({
			collections: { note: [note("Zebra", "z"), note(2024, "y"), note(undefined, "apple")] },
		});
		expect(notes.map((n) => n.title)).toEqual(["2024", "apple", "Zebra"]);
	});
});

describe("named headings", () => {
	it("renders a heading that contains a footnote reference", () => {
		const md = markdownIt().use(markdownItFootnote).use(namedHeadingsFilter);
		const html = md.render("# Character Sheet[^1]\n\nText\n\n[^1]: A footnote\n");
		expect(html).toMatch(/<h1 id="[^"]+">Character Sheet<sup class="footnote-ref">/);
	});
});

describe("favicon normalization", () => {
	let dir;
	afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }));

	const tmp = () => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "favicon-"));
		return dir;
	};

	it("wraps a PNG saved as favicon.svg so the favicon generator can read it", async () => {
		const d = tmp();
		const png = await sharp({
			create: { width: 64, height: 64, channels: 4, background: "#c33" },
		})
			.png()
			.toBuffer();
		fs.writeFileSync(path.join(d, "favicon.svg"), png);

		normalizeFavicon(path.join(d, "favicon.svg"), path.join(d, "out.svg"));

		const out = fs.readFileSync(path.join(d, "out.svg"), "utf8");
		expect(out).toMatch(/^<svg [^>]*><image [^>]*href="data:image\/png;base64,/);
		const rendered = await sharp(Buffer.from(out)).resize(16, 16).raw().toBuffer({ resolveWithObject: true });
		expect(rendered.info.width).toBe(16);
		expect(rendered.data[0]).toBeGreaterThan(150); // the red came through
	});

	it("leaves a small SVG favicon unchanged", () => {
		const d = tmp();
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle r="8"/></svg>';
		fs.writeFileSync(path.join(d, "favicon.svg"), svg);

		normalizeFavicon(path.join(d, "favicon.svg"), path.join(d, "out.svg"));

		expect(fs.readFileSync(path.join(d, "out.svg"), "utf8")).toBe(svg);
	});
});
