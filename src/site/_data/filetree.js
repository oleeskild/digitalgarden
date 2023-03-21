const fsFileTree = require("fs-file-tree");
const matter = require("gray-matter");
const fs = require("fs");

module.exports = async () => {
  const tree = await fsFileTree("src/site/notes");
  populateWithPermalink(tree);

  return sortTree(tree);
};

const sortTree = (unsorted) => {
  //Sort by folder before file, then by name
  const orderedTree = Object.keys(unsorted)
    .sort((a, b) => {
      let a_pinned = unsorted[a].pinned;
      let b_pinned = unsorted[b].pinned;
      if (a_pinned != b_pinned) {
        if (a_pinned) {
          return -1;
        } else {
          return 1;
        }
      }
      if (a.indexOf(".md") > -1 && b.indexOf(".md") === -1) {
        return 1;
      }

      if (a.indexOf(".md") === -1 && b.indexOf(".md") > -1) {
        return -1;
      }

      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }

      return -1;
    })
    .reduce((obj, key) => {
      obj[key] = unsorted[key];

      return obj;
    }, {});

  for (const key of Object.keys(orderedTree)) {
    if (!orderedTree[key].path) {
      orderedTree[key] = sortTree(orderedTree[key]);
    }
  }

  return orderedTree;
};

function getPermalinkMeta(path, key) {
  let permalink = "/";
  let name = key.replace(".md", "");
  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  let hide = false;
  let pinned = false;
  try {
    const file = fs.readFileSync(`${path}`, "utf8");
    const frontMatter = matter(file);
    if (frontMatter.data.permalink) {
      permalink = frontMatter.data.permalink;
    }
    if (
      frontMatter.data.tags &&
      frontMatter.data.tags.indexOf("gardenEntry") != -1
    ) {
      permalink = "/";
    }
    if (frontMatter.data.title) {
      name = frontMatter.data.title;
    }
    if (frontMatter.data.noteIcon) {
      noteIcon = frontMatter.data.noteIcon;
    }
    // Reason for adding the hide flag instead of removing completely from file tree is to
    // allow users to use the filetree data elsewhere without the fear of losing any data.
    if (frontMatter.data.hide) {
      hide = frontMatter.data.hide;
    }
    if (frontMatter.data.pinned) {
      pinned = frontMatter.data.pinned;
    }
  } catch {
    //ignore
  }

  return { permalink, name, noteIcon, hide, pinned };
}

function populateWithPermalink(tree) {
  Object.keys(tree).forEach((key) => {
    if (tree[key].path) {
      const isNote = tree[key].path.endsWith(".md");
      tree[key].isNote = isNote;
      if (isNote) {
        let meta = getPermalinkMeta(tree[key].path, key);
        Object.assign(tree[key], meta);
      }
    } else {
      tree[key].isFolder = true;
      populateWithPermalink(tree[key]);
    }
  });
}
