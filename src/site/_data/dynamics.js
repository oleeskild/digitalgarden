const fsFileTree = require("fs-file-tree");

const BASE_PATH = "src/site/_includes/components/user"
const NAMESPACES = ["index", "notes", "common"];
const SLOTS = ["header", "afterContent", "footer"]

const generateComponentPaths = async (namespace) => {
    const data = {};
    for (let index = 0; index < SLOTS.length; index++) {
        const slot = SLOTS[index];
        try {
            const tree = await fsFileTree(`${BASE_PATH}/${namespace}/${slot}`);
            let comps = Object.keys(tree).filter((p) => p.indexOf(".njk") != -1).map((p) => `components/user/${namespace}/${slot}/${p}`);
            comps.sort()
            data[slot] = comps;
        } catch {
            data[slot] = [];
        }
    }
    return data;
}


module.exports = async () => {
    const data = {};
    for (let index = 0; index < NAMESPACES.length; index++) {
        const ns = NAMESPACES[index];
        data[ns] = await generateComponentPaths(ns);
    }
    return data;
}