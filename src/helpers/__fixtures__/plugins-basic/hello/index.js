module.exports = {
  setupMarkdown(md, context) {
    md.__helloMarkdown = context.settings.greeting;
  },
  setupEleventy(eleventyConfig, context) {
    eleventyConfig.addFilter("helloFilter", () => context.settings.greeting);
  },
};
