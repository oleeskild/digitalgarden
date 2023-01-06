const wikilink = /\[\[(.*?\|.*?)\]\]/g
const internalLinkRegex = /href="\/(.*?)"/g;


function caselessCompare(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

function extractLinks(content) {
    return[...(content.match(wikilink) || []).map(link => (
        link.slice(2, -2)
            .split("|")[0]
            .replace(/.(md|markdown)\s?$/i, "")
            .replace("\\", "")
            .trim()
    )), ...(content.match(internalLinkRegex) || []).map(
        (link) =>
          link
            .slice(6, -1)
            .split("|")[0]
            .replace(/.(md|markdown)\s?$/i, "")
            .replace("\\", "")
            .trim()
    )];
}

function getBacklinks(data) {
    const notes = data.collections.note;
    if (!notes) {
        return [];
    }
    const currentFileSlug = data.page.filePathStem.replace('/notes/', '');
    const currentURL = data.page.url;

    let backlinks = [];
    let uniqueLinks = new Set();
    let counter = 1;

    for (const otherNote of notes) {
        const noteContent = otherNote.template.frontMatter.content;
        const backLinks = extractLinks(noteContent);

        if (!uniqueLinks.has(otherNote.url) && backLinks.some(link => caselessCompare(link, currentFileSlug) ||
        currentURL == link.split("#")[0])) {
            let preview = noteContent.slice(0, 240);
            backlinks.push({
                url: otherNote.url,
                title: otherNote.data.title || otherNote.data.page.fileSlug,
                preview,
                id: counter++
            })
            uniqueLinks.add(otherNote.url);
        }
    }
    return backlinks;
}

function getOutboundLinks(data, isHome=false){
    const notes = data.collections.note;

    

    if (!notes || notes.length == 0) {
        return [];
    }

    let currentNote;
    if (isHome) {
        currentNote = data.collections.gardenEntry && data.collections.gardenEntry[0];
    } else {
        const currentFileSlug = data.page.filePathStem.replace('/notes/', ''); 
        currentNote = notes.find(x => x.data.page.filePathStem && caselessCompare(x.data.page.filePathStem.replace('/notes/', ''), currentFileSlug));
    }

    if (!currentNote) {
        return [];
    }

    let counter = 1;
    let uniqueLinks = new Set();

    const outboundLinks = extractLinks(currentNote.template.frontMatter.content);
    let outbound = outboundLinks.map(fileslug => {
        var outboundNote = notes.find(x => caselessCompare(x.data.page.filePathStem.replace("/notes/", ""), fileslug) || x.data.page.url == fileslug.split("#")[0]);
        if (!outboundNote) {
            return null;
        }
        if (!uniqueLinks.has(outboundNote.url)) {
            
            uniqueLinks.add(outboundNote.url);
            return {
              url: outboundNote.url,
              title: outboundNote.data.title || outboundNote.data.page.fileSlug,
              id: counter++,
            };
        } else {
            return null;
        }
    }).filter(x => x);
    return outbound;
}

exports.wikilink = wikilink;
exports.internalLinkRegex = internalLinkRegex;
exports.getBacklinks = getBacklinks;
exports.getOutboundLinks = getOutboundLinks;
exports.caselessCompare = caselessCompare;
exports.extractLinks = extractLinks;