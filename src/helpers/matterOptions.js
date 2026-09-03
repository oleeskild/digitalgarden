// Obsidian writes [[Page\|Alias]] in frontmatter, but \| is an invalid YAML
// escape sequence. This custom engine strips \| before parsing. Shared by
// Eleventy's own frontmatter parser, the wikilink resolver in .eleventy.js and
// the fallback front page's home-note scan (src/site/index.11tydata.js).
const jsYamlForMatter = require(
  require.resolve("js-yaml", { paths: [require.resolve("gray-matter")] })
);

module.exports = {
  engines: {
    yaml: {
      parse: (str) => jsYamlForMatter.load(str.replace(/\\\|/g, "|")),
      stringify: (obj) => jsYamlForMatter.dump(obj),
    },
  },
};
