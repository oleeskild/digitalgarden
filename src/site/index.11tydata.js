require("dotenv").config();
const path = require("path");
const settings = require("../helpers/constants");
const pluginLoader = require("../helpers/pluginLoader");
const { hasHomePageNote } = require("../helpers/homePage");

// Fallback front page, rendered only when no published note is marked as the
// garden's home page (`dg-home` in Obsidian, which the plugin turns into the
// `gardenEntry` tag). Without it a garden with notes but no home page served a
// 404 at `/`, which read as "the site is broken" to new gardeners.
//
// A note with the gardenEntry tag takes the `/` permalink (see
// notes/notes.11tydata.js), so this template must step aside whenever one
// exists or Eleventy fails the build with an output conflict. The check reads
// the notes from disk because permalinks are resolved before collections
// exist, so `collections.gardenEntry` is not available here.
const hasHomePage = hasHomePageNote(path.join(__dirname, "notes"));

const allSettings = [
  ...settings.ALL_NOTE_SETTINGS,
  ...pluginLoader.getNoteSettingKeys(),
];

function noteTitle(note) {
  return (note.data && note.data.title) || note.fileSlug || note.url;
}

module.exports = {
  layout: "layouts/index.njk",
  eleventyExcludeFromCollections: true,
  isFallbackIndex: true,
  permalink: hasHomePage ? false : "/",
  eleventyComputed: {
    title: (data) => (data.meta && data.meta.siteName) || "Notes",
    // Notes get their per-page settings from notes/notes.11tydata.js; this
    // page has no frontmatter to override with, so the env defaults apply.
    settings: () => {
      const noteSettings = {};
      allSettings.forEach((setting) => {
        noteSettings[setting] = process.env[setting] === "true";
      });
      // A listing has no backlinks, no headings and no place in the graph;
      // the sidebar panels would render empty.
      noteSettings.dgShowBacklinks = false;
      noteSettings.dgShowLocalGraph = false;
      noteSettings.dgShowToc = false;
      return noteSettings;
    },
    publishedNotes: (data) => {
      const notes = (data.collections && data.collections.note) || [];
      return notes
        .filter((note) => note.data && note.data["dg-publish"] && !note.data.hide)
        .map((note) => ({ url: note.url, title: noteTitle(note) }))
        .sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        );
    },
  },
};
