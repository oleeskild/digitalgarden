const fsFileTree = require("fs-file-tree");
const matter = require('gray-matter');
const fs = require('fs');

module.exports = async () => {
    const tree = await fsFileTree("src/site/notes");
    populateWithPermalink(tree);

    return sortTree(tree);
}

const sortTree = (unsorted) => {
    //Sort by folder before file, then by name
    const orderedTree = Object.keys(unsorted).sort((a, b) => {
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
    }).reduce(
        (obj, key) => {
            obj[key] = unsorted[key];

            return obj;
        },
        {}
    );

    for (const key of Object.keys(orderedTree)) {
        if (!orderedTree[key].path) {
            orderedTree[key] = sortTree(orderedTree[key])
        }
    }

    return orderedTree;
}

function getPermalinkAndName(path, key) {
    let permalink = "/"
    let name = key.replace(".md", "");
    try {
        const file = fs.readFileSync(`${path}`, 'utf8');
        const frontMatter = matter(file);
        if (frontMatter.data.permalink) {
            permalink = frontMatter.data.permalink;
        }
        if (frontMatter.data.title) {
            name = frontMatter.data.title
        }
    } catch {
        //ignore
    }

    return { permalink, name };
}

function populateWithPermalink(tree) {
    Object.keys(tree).forEach(key => {
        if (tree[key].path) {
            const isNote = tree[key].path.endsWith(".md");
            tree[key].isNote = isNote;
            if (isNote) {
                let { permalink, name } = getPermalinkAndName(tree[key].path, key);
                tree[key].permalink = permalink
                tree[key].name = name
            }
        } else {
            tree[key].isFolder = true;
            populateWithPermalink(tree[key]);
        }
    });
}
