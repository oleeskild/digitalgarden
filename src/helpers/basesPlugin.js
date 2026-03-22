const { executeBaseQuery, renderViews } = require("./bases-engine");
const linkUtils = require("./linkUtils");

// Cache rendered HTML keyed by YAML + notes count to avoid stale results
// during the data cascade build phase
const renderCache = new Map();

function basesPlugin(md) {
  const origFence =
    md.renderer.rules.fence ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    if (token.info.trim() === "base") {
      try {
        // Prefer enriched notes with links/backlinks (from graph builder),
        // fall back to plain notes from the data cascade
        const notes = linkUtils._basesNotesWithLinks || (env && env.basesNotes) || [];
        return renderBaseBlock(token.content, notes);
      } catch (err) {
        console.error("Error processing base query:", err);
        return '<div class="obsidian-base-error">' + escapeHtml(err.message || "Unknown error") + '</div>';
      }
    }

    return origFence(tokens, idx, options, env, self);
  };
}

function renderBaseBlock(yamlContent, notes) {
  // Cache key includes notes length so we don't serve stale results
  // if the collection wasn't fully built on a prior call
  const cacheKey = yamlContent + "\0" + notes.length;
  if (renderCache.has(cacheKey)) return renderCache.get(cacheKey);
  const result = executeBaseQuery(yamlContent, notes);
  const html = renderViews(result, notes);
  renderCache.set(cacheKey, html);
  return html;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

module.exports = { basesPlugin };
