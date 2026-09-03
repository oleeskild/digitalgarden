const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const matterOptions = require("./matterOptions");

const HOME_TAG = "gardenEntry";

/**
 * Whether a note's frontmatter marks it as the garden's home page. The
 * Obsidian plugin turns `dg-home: true` into the `gardenEntry` tag, which is
 * what the rest of the build keys on (see notes/notes.11tydata.js).
 */
function frontmatterIsHomePage(data) {
  const tags = data && data.tags;
  if (Array.isArray(tags)) {
    return tags.includes(HOME_TAG);
  }
  if (typeof tags === "string") {
    return tags.split(/[,\s]+/).includes(HOME_TAG);
  }
  return false;
}

function fileIsHomePage(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return false;
  }
  // Cheap pre-check: the tag has to appear literally for the note to be home.
  if (!raw.includes(HOME_TAG)) {
    return false;
  }
  try {
    return frontmatterIsHomePage(matter(raw, matterOptions).data);
  } catch {
    // Unparseable frontmatter that mentions the tag. Assume it is the home
    // page: a wrong "yes" only keeps the fallback front page off, while a
    // wrong "no" would make two templates write `/index.html` and fail the
    // whole build.
    return true;
  }
}

function* walkMarkdownFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdownFiles(full);
    } else if (/\.(md|markdown)$/i.test(entry.name)) {
      yield full;
    }
  }
}

/**
 * True when any note under `notesDir` is tagged as the garden's home page.
 *
 * Read straight from disk rather than from Eleventy collections: the fallback
 * front page needs this to decide its permalink, and Eleventy resolves
 * permalinks before collections exist.
 */
function hasHomePageNote(notesDir) {
  for (const file of walkMarkdownFiles(notesDir)) {
    if (fileIsHomePage(file)) {
      return true;
    }
  }
  return false;
}

module.exports = { hasHomePageNote, frontmatterIsHomePage, HOME_TAG };
