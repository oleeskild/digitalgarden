require("dotenv").config();
const settings = require("../helpers/constants");

const markdownIt = require("markdown-it");
const md = markdownIt({
  html: true,
}).use(require("../helpers/utils").namedHeadingsFilter);

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
  eleventyComputed: {
    settings: (data) => {
      const currentnote =
        data.collections.gardenEntry && data.collections.gardenEntry[0];
      if (currentnote && currentnote.data) {
        const noteSettings = {};
        allSettings.forEach((setting) => {
          let noteSetting = currentnote.data[setting];
          let globalSetting = process.env[setting];

          let settingValue =
            noteSetting || (globalSetting === "true" && noteSetting !== false);
          noteSettings[setting] = settingValue;
        });
        return noteSettings;
      }
      return {};
    },
    noteTitle: (data) => {
      const currentnote =
        data.collections.gardenEntry && data.collections.gardenEntry[0];
      if (currentnote && currentnote.data) {
        return currentnote.data.title || currentnote.data.page.fileSlug;
      }
      return "";
    },
    tags: (data) => {
      const currentnote =
        data.collections.gardenEntry && data.collections.gardenEntry[0];
      if (currentnote && currentnote.data) {
        return currentnote.data.tags;
      }
      return [];
    },
    content: (data) => {
      const currentnote =
        data.collections.gardenEntry && data.collections.gardenEntry[0];
      if (
        currentnote &&
        currentnote.template &&
        currentnote.template.frontMatter &&
        currentnote.template.frontMatter.content
      ) {
        return md.render(currentnote.template.frontMatter.content);
      }
      return "";
    },
  },
};
