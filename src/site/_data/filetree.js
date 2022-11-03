const fsFileTree = require("fs-file-tree");
const matter = require('gray-matter');
const fs = require('fs');

module.exports = async () => {
    const tree = await fsFileTree("src/site/notes");
    populateWithPermalink(tree);
    
    //Sort by folder before file, then by name
    const orderedTree = Object.keys(tree).sort((a,b)=>{
        if(a.indexOf(".md") > -1 && b.indexOf(".md") === -1){
            return 1;
        }

        if(a.indexOf(".md") === -1 && b.indexOf(".md") > -1){
            return -1;
        }

        if(a>b){
            return 1;
        }

        return -1;
    }).reduce(
        (obj, key) => {
            obj[key] = tree[key];
            return obj;
        },
        {}
    );
    return orderedTree;
}

function getPermalink(path) {
    let permalink = "/"
    try {
        const file = fs.readFileSync(`${path}`, 'utf8');
        const frontMatter = matter(file);
        if (frontMatter.data.permalink) {
            permalink = frontMatter.data.permalink;
        }
    } catch {
        //ignore
    }

    return permalink;
}

function populateWithPermalink(tree) {
    Object.keys(tree).forEach(key => {
        if (tree[key].path) {
            const isNote = tree[key].path.endsWith(".md");
            tree[key].isNote = isNote;
            if (isNote) {
                tree[key].permalink = getPermalink(tree[key].path);
                tree[key].name = key.replace(".md", "");
            }
        } else {
            tree[key].isFolder = true;
            populateWithPermalink(tree[key]);
        }
    });
}
