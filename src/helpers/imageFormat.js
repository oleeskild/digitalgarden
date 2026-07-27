const fs = require("fs");

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

module.exports = { isTransformableImage };
