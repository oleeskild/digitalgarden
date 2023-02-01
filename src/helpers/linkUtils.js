const wikiLinkRegex = /\[\[(.*?\|.*?)\]\]/g;
const internalLinkRegex = /href="\/(.*?)"/g;

function caselessCompare(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function extractLinks(content) {
  return [
    ...(content.match(wikiLinkRegex) || []).map(
      (link) =>
        link
          .slice(2, -2)
          .split("|")[0]
          .replace(/.(md|markdown)\s?$/i, "")
          .replace("\\", "")
          .trim()
          .split("#")[0]
    ),
    ...(content.match(internalLinkRegex) || []).map(
      (link) =>
        link
          .slice(6, -1)
          .split("|")[0]
          .replace(/.(md|markdown)\s?$/i, "")
          .replace("\\", "")
          .trim()
          .split("#")[0]
    ),
  ];
}

function getBacklinks(data) {
  const notes = data.collections.note;
  if (!notes) {
    return [];
  }
  const currentFileSlug = data.page.filePathStem
    .replace("/notes/", "")
    .split("#")[0];
  const currentURL = data.page.url;

  let backlinks = [];
  let uniqueLinks = new Set();
  let counter = 1;

  for (const otherNote of notes) {
    const noteContent = otherNote.template.frontMatter.content;
    const backLinks = extractLinks(noteContent);

    if (
      !uniqueLinks.has(otherNote.url) &&
      backLinks.some(
        (link) =>
          caselessCompare(link, currentFileSlug) ||
          currentURL == link.split("#")[0]
      )
    ) {
      let preview = noteContent.slice(0, 240);
      backlinks.push({
        url: otherNote.url,
        title: otherNote.data.title || otherNote.data.page.fileSlug,
        preview,
        id: counter++,
        isHome: otherNote.data["dg-home"] || false,
      });
      uniqueLinks.add(otherNote.url);
    }
  }
  return backlinks;
}

exports.wikiLinkRegex = wikiLinkRegex;
exports.internalLinkRegex = internalLinkRegex;
exports.extractLinks = extractLinks;
exports.getBacklinks = getBacklinks;
