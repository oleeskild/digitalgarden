const fs = require("fs");
const path = require("path");

// Same tag pattern as the core taggify filter (.eleventy.js).
const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;

module.exports = {
  setupEleventy(eleventyConfig, context) {
    eleventyConfig.addFilter("stripForSearch", function (content) {
      return content
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    });

    eleventyConfig.addFilter("searchableTags", function (str) {
      let tags;
      let match = str && str.match(tagRegex);
      if (match) {
        tags = match
          .map((m) => {
            return `"${m.split("#")[1]}"`;
          })
          .join(", ");
      }
      if (tags) {
        return `${tags},`;
      } else {
        return "";
      }
    });

    eleventyConfig.addFilter("validJson", function (variable) {
      if (Array.isArray(variable)) {
        return variable.map((x) => x.replaceAll("\\", "\\\\")).join(",");
      } else if (typeof variable === "string") {
        return variable.replaceAll("\\", "\\\\");
      }
      return variable;
    });

    // The search index needs collections.note, which slot templates don't
    // get — register it as a virtual template so it joins the data cascade.
    const indexTemplate = fs.readFileSync(
      path.join(context.pluginDir, "templates", "search-index.njk"),
      "utf8"
    );
    eleventyConfig.addTemplate("dg-search-index.njk", indexTemplate, {
      permalink: "/searchIndex.json",
      eleventyExcludeFromCollections: true,
    });
  },
};
