
require("dotenv").config();
const settings = require("../helpers/constants");

const wikilink = /\[\[(.*?\|.*?)\]\]/g

const markdownIt = require("markdown-it");
const md = markdownIt({
    html: true,
}).use(require("../helpers/utils").namedHeadingsFilter);

function caselessCompare(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

const allSettings = settings.ALL_NOTE_SETTINGS;

module.exports = {
    eleventyComputed: {
        backlinks: (data) => {
            const notes = data.collections.note;
            if (!notes) {
                return [];
            }
            const currentFileSlug = data.page.filePathStem.replace('/notes/', '');

            let backlinks = [];
            let counter = 1;

            for (const otherNote of notes) {
                const noteContent = otherNote.template.frontMatter.content;

                const outboundLinks = (noteContent.match(wikilink) || []).map(link => (
                    link.slice(2, -2)
                        .split("|")[0]
                        .replace(/.(md|markdown)\s?$/i, "")
                        .replace("\\", "")
                        .trim()
                ));

                if (outboundLinks.some(link => caselessCompare(link, currentFileSlug))) {

                    let preview = noteContent.slice(0, 240);
                    backlinks.push({
                        url: otherNote.url,
                        title: otherNote.data.page.fileSlug,
                        preview,
                        id: counter++
                    })
                }
            }

            return backlinks;

        },
        outbound: (data) => {
            const notes = data.collections.note;

            if (!notes || notes.length == 0) {
                return [];
            }

            const currentNote = data.collections.gardenEntry && data.collections.gardenEntry[0];
            if (!currentNote) {
                return [];
            }


            let counter = 1;

            const noteContent = currentNote.template.frontMatter.content;

            const outboundLinks = (noteContent.match(wikilink) || []).map(link => (
                link.slice(2, -2)
                    .split("|")[0]
                    .replace(/.(md|markdown)\s?$/i, "")
                    .replace("\\", "")
                    .trim()
            ));

            let outbound = outboundLinks.map(fileslug => {
                var outboundNote = notes.find(x => caselessCompare(x.data.page.filePathStem.replace("/notes/", ""), fileslug));
                if (!outboundNote) {
                    return null;
                }

                return {
                    url: outboundNote.url,
                    title: outboundNote.data.page.fileSlug,
                    id: counter++
                }
            }).filter(x => x);

            return outbound;

        },
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
                return currentnote.data.page.fileSlug;
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