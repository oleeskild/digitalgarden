import { getGraph } from "../../helpers/linkUtils.js";
import { getFileTree } from "../../helpers/filetreeUtils.js";
import { userComputed } from "../../helpers/userUtils.js";
export const graph = (data) => getGraph(data);
export const filetree = (data) => getFileTree(data);
export default {
    graph,
    filetree,
    userComputed: (data) => userComputed(data)
};
