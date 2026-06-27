const renderCache = new Map();
let renderCacheBuildId = 0;

function clearRenderCache() {
  renderCache.clear();
  renderCacheBuildId++;
}

function getRenderCache() {
  return renderCache;
}

function getRenderCacheBuildId() {
  return renderCacheBuildId;
}

module.exports = {
  clearRenderCache,
  getRenderCache,
  getRenderCacheBuildId,
};