const path = require("path");
const { hasHomePageNote } = require("../helpers/homePage");

// Companion to index.njk: emitted only while the fallback front page is in
// use, so the hosting side can tell "root index.html is a listing" from
// "root index.html is the gardener's home note". Forestry.md reads it to
// decide whether a garden has a home page yet.
module.exports = {
  eleventyExcludeFromCollections: true,
  permalink: hasHomePageNote(path.join(__dirname, "notes"))
    ? false
    : "/dg-fallback-index.txt",
};
