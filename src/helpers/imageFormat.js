const fs = require("fs");
const { createRequire } = require("module");

// Use the exact sharp instance eleventy-img uses, so "can we decode this?"
// always agrees with what the optimization pipeline can actually do.
let sharp;
try {
	sharp = createRequire(require.resolve("@11ty/eleventy-img"))("sharp");
} catch {
	sharp = require("sharp");
}

/**
 * Check whether a file's actual content is an image format the sharp-based
 * optimization pipeline can decode, by sniffing magic bytes. Extensions
 * lie — e.g. iPhone HEIC photos renamed to .jpg — and feeding sharp an
 * undecodable file fails the whole Eleventy build via an unhandled
 * rejection. Unknown or unreadable files return false so the caller can
 * leave the original <img> untouched.
 */
function isTransformableImage(filePath) {
	let header;

	try {
		const fd = fs.openSync(filePath, "r");
		header = Buffer.alloc(16);
		fs.readSync(fd, header, 0, 16, 0);
		fs.closeSync(fd);
	} catch {
		return false;
	}

	// JPEG
	if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
		return true;
	}

	// PNG
	if (header.subarray(0, 8).equals(Buffer.from("\x89PNG\r\n\x1a\n", "latin1"))) {
		return true;
	}

	// GIF87a / GIF89a
	const ascii = header.toString("latin1");
	if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) {
		return true;
	}

	// WebP: RIFF....WEBP
	if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") {
		return true;
	}

	// TIFF (also the container some raw formats use)
	if (ascii.startsWith("II*\x00") || ascii.startsWith("MM\x00*")) {
		return true;
	}

	// AVIF: ISO-BMFF ftyp box with an avif brand — sharp decodes these.
	// Other ftyp brands (heic, heix, mif1…) are HEIC/HEIF: not decodable.
	if (ascii.slice(4, 8) === "ftyp") {
		return ascii.slice(8, 12) === "avif";
	}

	return false;
}

// Probe results memoized per file version — decoding is the expensive part
// and the same image is typically referenced from many pages.
const decodableCache = new Map();

/**
 * Check whether sharp can actually decode a file, by decoding it.
 *
 * Header sniffing (isTransformableImage) is a fast first filter, but a
 * valid header proves nothing about the bitstream: a truncated AVIF still
 * says "ftypavif" yet fails mid-decode, and eleventy-img leaves internal
 * promise rejections unhandled on decode failure, which kills the whole
 * Eleventy build. Only files that pass a real decode may enter the
 * optimization pipeline.
 */
async function isDecodableImage(filePath) {
	if (!isTransformableImage(filePath)) {
		return false;
	}

	let cacheKey;

	try {
		const stat = fs.statSync(filePath);
		cacheKey = `${filePath}:${stat.mtimeMs}:${stat.size}`;
	} catch {
		return false;
	}

	if (decodableCache.has(cacheKey)) {
		return decodableCache.get(cacheKey);
	}

	const probe = sharp(filePath)
		.stats()
		.then(
			() => true,
			(err) => {
				console.warn(
					`[image] ${filePath} cannot be decoded and will not be optimized: ${err.message.split("\n")[0]}`,
				);

				return false;
			},
		);

	decodableCache.set(cacheKey, probe);

	return probe;
}

module.exports = { isTransformableImage, isDecodableImage };
