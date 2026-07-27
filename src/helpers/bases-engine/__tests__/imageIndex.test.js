import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { createImageIndex, scanImageDir } from "../imageIndex.js";

describe("createImageIndex", () => {
	const index = createImageIndex([
		"06 Assets/Blog/Album Covers/AmericanWater.jpg",
		"06 Assets/Blog/Album Covers/ColourGreen.jpg",
		"06 Assets/pics/photo.jpg",
		"other/deep/nested/photo.jpg",
		"cover.png",
	]);

	it("resolves a bare filename to its full published path", () => {
		expect(index.resolve("AmericanWater.jpg")).toBe(
			"06 Assets/Blog/Album Covers/AmericanWater.jpg",
		);
	});

	it("resolves an exact full path to itself", () => {
		expect(index.resolve("06 Assets/Blog/Album Covers/ColourGreen.jpg")).toBe(
			"06 Assets/Blog/Album Covers/ColourGreen.jpg",
		);
	});

	it("resolves a partial subpath ending at a path boundary", () => {
		expect(index.resolve("Album Covers/AmericanWater.jpg")).toBe(
			"06 Assets/Blog/Album Covers/AmericanWater.jpg",
		);
	});

	it("resolves case-insensitively but returns the real casing", () => {
		expect(index.resolve("americanwater.jpg")).toBe(
			"06 Assets/Blog/Album Covers/AmericanWater.jpg",
		);
	});

	it("picks the shortest path when several files share a name", () => {
		expect(index.resolve("photo.jpg")).toBe("06 Assets/pics/photo.jpg");
	});

	it("resolves a root-level file", () => {
		expect(index.resolve("cover.png")).toBe("cover.png");
	});

	it("returns null when nothing matches", () => {
		expect(index.resolve("missing.jpg")).toBe(null);
	});

	it("does not match partial filename suffixes", () => {
		// "Water.jpg" is a suffix of "AmericanWater.jpg" but not a path segment
		expect(index.resolve("Water.jpg")).toBe(null);
	});
});

describe("scanImageDir", () => {
	it("returns relative paths of all files under the root", () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "img-index-"));
		fs.mkdirSync(path.join(root, "06 Assets", "Covers"), {
			recursive: true,
		});
		fs.writeFileSync(path.join(root, "top.png"), "");
		fs.writeFileSync(path.join(root, "06 Assets", "Covers", "a.jpg"), "");

		const paths = scanImageDir(root).sort();

		expect(paths).toEqual(["06 Assets/Covers/a.jpg", "top.png"]);
		fs.rmSync(root, { recursive: true, force: true });
	});

	it("returns an empty array when the root does not exist", () => {
		expect(scanImageDir("/nonexistent/img/user")).toEqual([]);
	});
});
