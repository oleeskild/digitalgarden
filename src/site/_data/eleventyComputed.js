const { getGraph } = require("../../helpers/linkUtils");
const { userComputed } = require("../../helpers/userUtils");

module.exports = {
  graph: (data) => getGraph(data),
  userComputed: (data) => userComputed(data),
};
