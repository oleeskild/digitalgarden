const slugify = require("@sindresorhus/slugify");

// slugify rebuilds its transliteration/escape regexes on every call, which
// makes it one of the most expensive functions in a build (it runs for every
// heading and every wikilink). The same strings repeat constantly, so memoize.
const slugifyCache = new Map();
const SLUGIFY_CACHE_MAX = 50000;

function cachedSlugify(input) {
    if (slugifyCache.has(input)) {
        return slugifyCache.get(input);
    }
    const result = slugify(input);
    if (slugifyCache.size >= SLUGIFY_CACHE_MAX) {
        slugifyCache.clear();
    }
    slugifyCache.set(input, result);
    return result;
}

function headerToId(heading) {
    var slugifiedHeader = cachedSlugify(heading);
    if(!slugifiedHeader){
        return heading;
    }
    return slugifiedHeader;
}

function namedHeadings(md, state) {

    var ids = {}

    state.tokens.forEach(function(token, i) {
        if (token.type === 'heading_open') {
            var text = md.renderer.render(state.tokens[i + 1].children, md.options)
            var id = headerToId(text);
            var uniqId = uncollide(ids, id)
            ids[uniqId] = true
            setAttr(token, 'id', uniqId)
        }
    })
}

function uncollide(ids, id) {
    if (!ids[id]) return id
    var i = 1
    while (ids[id + '-' + i]) { i++ }
    return id + '-' + i
}

function setAttr(token, attr, value, options) {
    var idx = token.attrIndex(attr)

    if (idx === -1) {
        token.attrPush([attr, value])
    } else if (options && options.append) {
        token.attrs[idx][1] =
            token.attrs[idx][1] + ' ' + value
    } else {
        token.attrs[idx][1] = value
    }
}

//https://github.com/rstacruz/markdown-it-named-headings/blob/master/index.js
exports.namedHeadingsFilter = function (md, options) {
    md.core.ruler.push('named_headings', namedHeadings.bind(null, md));
}

exports.headerToId = headerToId;
exports.cachedSlugify = cachedSlugify;