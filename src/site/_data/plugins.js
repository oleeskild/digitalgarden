const pluginLoader = require("../../helpers/pluginLoader");

// Re-read the plugins directory on every build so slot/style edits
// hot-reload in dev. Hook registrations (filters, virtual templates) are
// config-time and still need a dev-server restart.
module.exports = () => {
  pluginLoader.loadPlugins({ force: true });
  return pluginLoader.getTemplateData();
};
