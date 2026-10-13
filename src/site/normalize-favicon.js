const fs = require("fs");
const path = require("path");

const MAX_DIM = 512;

const RASTER_SIGNATURES = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], extra: [8, [0x57, 0x45, 0x42, 0x50]] },
];

function rasterMimeType(buffer) {
  const startsWith = (offset, bytes) => bytes.every((b, i) => buffer[offset + i] === b);
  const match = RASTER_SIGNATURES.find(
    (sig) => startsWith(0, sig.bytes) && (!sig.extra || startsWith(sig.extra[0], sig.extra[1]))
  );
  return match ? match.mime : null;
}

// A PNG/JPEG/GIF/WebP uploaded as favicon.svg can't be read by the favicon
// generator, which failed the whole build. Embed it in an SVG instead.
function wrapRaster(buffer, mime) {
  const href = `data:${mime};base64,${buffer.toString("base64")}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${MAX_DIM}" height="${MAX_DIM}" viewBox="0 0 ${MAX_DIM} ${MAX_DIM}">` +
    `<image width="${MAX_DIM}" height="${MAX_DIM}" preserveAspectRatio="xMidYMid meet" ` +
    `href="${href}" xlink:href="${href}"/></svg>`
  );
}

function normalizeFavicon(inputPath, outputPath) {
  const buffer = fs.readFileSync(inputPath);

  const mime = rasterMimeType(buffer);
  if (mime) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, wrapRaster(buffer, mime));
    return;
  }

  const content = buffer.toString("utf8");

  const svgTagMatch = content.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);
    return;
  }

  const svgTag = svgTagMatch[0];
  const widthMatch = svgTag.match(/\bwidth\s*=\s*"([^"]+)"/i);
  const heightMatch = svgTag.match(/\bheight\s*=\s*"([^"]+)"/i);
  const viewBoxMatch = svgTag.match(/\bviewBox\s*=\s*"([^"]+)"/i);

  const parseDim = (s) => {
    if (s === undefined || s === null) return NaN;
    const m = String(s).match(/^[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
  };

  let effectiveWidth = parseDim(widthMatch && widthMatch[1]);
  let effectiveHeight = parseDim(heightMatch && heightMatch[1]);

  if ((!isFinite(effectiveWidth) || !isFinite(effectiveHeight)) && viewBoxMatch) {
    const vb = viewBoxMatch[1].trim().split(/[\s,]+/).map(parseFloat);
    if (vb.length === 4) {
      if (!isFinite(effectiveWidth)) effectiveWidth = vb[2];
      if (!isFinite(effectiveHeight)) effectiveHeight = vb[3];
    }
  }

  const maxDim = Math.max(effectiveWidth || 0, effectiveHeight || 0);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (!isFinite(maxDim) || maxDim === 0 || maxDim <= MAX_DIM) {
    fs.writeFileSync(outputPath, content);
    return;
  }

  const scale = MAX_DIM / maxDim;
  const newWidth = Math.round(effectiveWidth * scale);
  const newHeight = Math.round(effectiveHeight * scale);

  let newSvgTag = svgTag;

  if (!viewBoxMatch) {
    newSvgTag = newSvgTag.replace(
      /<svg\b/i,
      `<svg viewBox="0 0 ${effectiveWidth} ${effectiveHeight}"`
    );
  }

  if (widthMatch) {
    newSvgTag = newSvgTag.replace(/\bwidth\s*=\s*"[^"]+"/i, `width="${newWidth}"`);
  } else {
    newSvgTag = newSvgTag.replace(/<svg\b/i, `<svg width="${newWidth}"`);
  }
  if (heightMatch) {
    newSvgTag = newSvgTag.replace(/\bheight\s*=\s*"[^"]+"/i, `height="${newHeight}"`);
  } else {
    newSvgTag = newSvgTag.replace(/<svg\b/i, `<svg height="${newHeight}"`);
  }

  fs.writeFileSync(outputPath, content.replace(svgTag, newSvgTag));
}

module.exports = normalizeFavicon;
