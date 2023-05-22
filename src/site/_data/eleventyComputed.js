const { getGraph } = require("../../helpers/linkUtils");
const { getIndex } = require("../../helpers/searchUtils");
const { getFileTree } = require("../../helpers/filetreeUtils");
const { userComputed } = require("../../helpers/userUtils");

module.exports = {
  graph: (data) => getGraph(data),
  filetree: (data) => getFileTree(data),
  userComputed: (data) => userComputed(data),
  searchIndex: () => getIndex(),
};
