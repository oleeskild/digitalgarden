const tagRegex = /(^|\s|\>)(#[^\s!@#$%^&*()=+\.,\[{\]};:'"?><]+)(?!([^<]*>))/g;
const protectedBlockRegex = /<(code|pre|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

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

exports.tagRegex = tagRegex;
exports.taggify = taggify;
