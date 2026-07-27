import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { isTransformableImage, isDecodableImage } from "./imageFormat.js";

const writeTemp = (name, bytes) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "img-format-"));
	const file = path.join(dir, name);
	fs.writeFileSync(file, Buffer.from(bytes));
	return file;
};

describe("isTransformableImage", () => {
	it("accepts a JPEG regardless of extension", () => {
		expect(
			isTransformableImage(writeTemp("photo.jpg", [0xff, 0xd8, 0xff, 0xe0])),
		).toBe(true);
	});

	it("accepts a PNG", () => {
		expect(
			isTransformableImage(
				writeTemp("img.png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			),
		).toBe(true);
	});

	it("accepts a WebP", () => {
		const riff = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")];
		expect(isTransformableImage(writeTemp("img.webp", riff))).toBe(true);
	});

	it("accepts a GIF", () => {
		expect(
			isTransformableImage(writeTemp("img.gif", Buffer.from("GIF89a"))),
		).toBe(true);
	});

	it("rejects a HEIC file renamed to .jpg", () => {
		// iPhone photos: 4-byte box size, then "ftypheic"
		const heic = [0, 0, 0, 24, ...Buffer.from("ftypheic"), 0, 0, 0, 0];
		expect(isTransformableImage(writeTemp("EyetotheEar.jpg", heic))).toBe(
			false,
		);
	});

	it("rejects arbitrary non-image bytes", () => {
		expect(
			isTransformableImage(
				writeTemp("fake.jpg", Buffer.from("hello, not an image")),
			),
		).toBe(false);
	});

	it("rejects a missing file", () => {
		expect(isTransformableImage("/nonexistent/img.jpg")).toBe(false);
	});
});

describe("isDecodableImage", () => {
	it("rejects a truncated AVIF that passes header sniffing", async () => {
		// Real-world case: a truncated AVIF renamed to .jpg has a valid
		// ftypavif header but cannot be decoded ("bad seek to ...").
		await expect(
			isDecodableImage(
				path.join(__dirname, "__fixtures__", "truncated.avif.jpg"),
			),
		).resolves.toBe(false);
	});

	it("accepts a real decodable image", async () => {
		await expect(
			isDecodableImage("src/site/img/tree-1.svg").then(Boolean),
		).resolves.toBe(false); // svg is not in scope for the optimizer

		await expect(
			isDecodableImage("src/site/img/user/A Assets/travolta.png"),
		).resolves.toBe(true);
	});

	it("rejects HEIC content without invoking a decode", async () => {
		const heic = [0, 0, 0, 24, ...Buffer.from("ftypheic"), 0, 0, 0, 0];
		await expect(
			isDecodableImage(writeTemp("photo.jpg", heic)),
		).resolves.toBe(false);
	});

	it("rejects a missing file", async () => {
		await expect(isDecodableImage("/nonexistent/img.jpg")).resolves.toBe(
			false,
		);
	});
});
