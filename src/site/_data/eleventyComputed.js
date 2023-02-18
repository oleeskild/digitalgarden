const { getGraph } = require("../../helpers/linkUtils");
const { getIndex } = require("../../helpers/searchUtils");
const { userComputed } = require("../../helpers/userUtils");

module.exports = {
  graph: (data) => getGraph(data),
  userComputed: (data) => userComputed(data),
  searchIndex: () => getIndex(),
};
