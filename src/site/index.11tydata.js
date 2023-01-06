
require("dotenv").config();
const settings = require("../helpers/constants");

const markdownIt = require("markdown-it");
const { getBacklinks, getOutboundLinks } = require("../helpers/linkUtils");
const md = markdownIt({
    html: true,
}).use(require("../helpers/utils").namedHeadingsFilter);

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
    eleventyComputed: {
        backlinks: (data) => getBacklinks(data),
        outbound: (data) => getOutboundLinks(data, true),
        settings: (data) => {
            const currentnote = data.collections.gardenEntry && data.collections.gardenEntry[0];
            if (currentnote && currentnote.data) {
                const noteSettings = {};
                allSettings.forEach(setting => {
                    let noteSetting = currentnote.data[setting];
                    let globalSetting = process.env[setting];

                    let settingValue = (noteSetting || (globalSetting === 'true' && noteSetting !== false));
                    noteSettings[setting] = settingValue;
                });
                return noteSettings;

            }
            return {};
        },
        noteTitle: (data) => {
            const currentnote = data.collections.gardenEntry && data.collections.gardenEntry[0];
            if (currentnote && currentnote.data) {
                return currentnote.data.title || currentnote.data.page.fileSlug;
            }
            return "";
        },
        content: (data) => {
            const currentnote = data.collections.gardenEntry && data.collections.gardenEntry[0];
            if (currentnote && currentnote.template && currentnote.template.frontMatter && currentnote.template.frontMatter.content) {
                return md.render(currentnote.template.frontMatter.content);
            }
            return "";
        }
    }
}