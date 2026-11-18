const fs = require("fs");
const path = require("path");

// The file tree lists every note, so inlining it in every page makes the
// build grow with notes² (a 1,400-note garden produced ~450 KB per page and
// ran the builder out of memory). Render it once to /filetree.html instead;
// the sidebar fetches it and marks the current note client-side.
module.exports = {
  setupEleventy(eleventyConfig, context) {
    const treeTemplate = fs.readFileSync(
      path.join(context.pluginDir, "templates", "tree.njk"),
      "utf8"
    );
    eleventyConfig.addTemplate("dg-filetree-tree.njk", treeTemplate, {
      permalink: "/filetree.html",
      eleventyExcludeFromCollections: true,
    });
  },
};
