const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;
const protectedBlockRegex = /<(code|pre|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

function withoutProtectedBlocks(content) {
  if (!content) return content;
  return content.replace(protectedBlockRegex, " ");
}

function linkTags(content) {
  return content.replace(tagRegex, (match, precede, tag) => {
    return `${precede}<a class="tag" href="javascript:void(0);" onclick="toggleTagSearch(this)">${tag}</a>`;
  });
}

function taggify(content) {
  let result = "";
  let previousEnd = 0;
  let match;

  protectedBlockRegex.lastIndex = 0;
  while ((match = protectedBlockRegex.exec(content)) !== null) {
    result += linkTags(content.slice(previousEnd, match.index));
    result += match[0];
    previousEnd = match.index + match[0].length;
  }

  return result + linkTags(content.slice(previousEnd));
}

/**
 * Extract unique #tags from HTML-ish content, ignoring protected blocks
 * (code/pre/script/style) so MathJax CSS hex colors are not treated as tags.
 */
function extractSearchableTags(content) {
  if (!content) return [];

  const searchable = withoutProtectedBlocks(content);
  const matches = searchable.match(tagRegex) || [];
  const tags = [];
  const seen = new Set();

  for (const match of matches) {
    const tag = match.split("#")[1];
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
}

exports.tagRegex = tagRegex;
exports.taggify = taggify;
exports.withoutProtectedBlocks = withoutProtectedBlocks;
exports.extractSearchableTags = extractSearchableTags;
