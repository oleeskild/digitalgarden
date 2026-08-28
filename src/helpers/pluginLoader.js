/**
 * Garden plugin loader.
 *
 * Discovers plugins in src/plugins/<id>/ (each with a garden-plugin.json
 * manifest), reads the user-owned state registry src/plugins/plugins.json,
 * and exposes:
 *   - config-time hooks (applyMarkdownHooks / applyEleventyHooks), called
 *     from .eleventy.js just before the userSetup.js hooks
 *   - template data (getTemplateData), exposed via src/site/_data/plugins.js
 *   - extra per-note setting keys (getNoteSettingKeys), merged into the
 *     ALL_NOTE_SETTINGS resolution in notes.11tydata.js
 *
 * Contract: a broken plugin (malformed manifest, unsafe path, throwing hook)
 * must never fail the build — every failure is a console.warn + skip.
 * Plugin docs: https://docs.forestry.md/
 */

const fs = require("fs");
const path = require("path");

const PLUGINS_ROOT = "src/plugins";
const OUTPUT_ROOT = "dist";
// Generated (gitignored): slot templates are copied here so they can be
// rendered with a plain {% include %} and receive the full data cascade.
const INCLUDES_ROOT = "src/site/_includes/plugins";
const REGISTRY_FILE = "plugins.json";
const MANIFEST_FILE = "garden-plugin.json";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const REQUIRED_FIELDS = ["id", "name", "version", "description", "author"];

const KNOWN_SLOTS = new Set([
  "common.head",
  "common.header",
  "common.beforeContent",
  "common.afterContent",
  "common.footer",
  "notes.head",
  "notes.header",
  "notes.beforeContent",
  "notes.afterContent",
  "notes.footer",
  "index.head",
  "index.header",
  "index.beforeContent",
  "index.afterContent",
  "index.footer",
  "filetree.beforeTitle",
  "filetree.afterTitle",
  "filetree.actions",
  "sidebar.top",
  "sidebar.bottom",
  "navbar.actions",
]);

/**
 * Regions are exclusive render sites: the core renders its built-in default
 * unless exactly one enabled plugin claims the region. Unlike slots (which
 * are additive), a region has at most one provider.
 */
const KNOWN_REGIONS = new Set(["navigation"]);

let cache = null;
let cacheRoot = null;

function warn(message) {
  console.warn(`[plugins] ${message}`);
}

/**
 * A manifest-declared path must stay inside the plugin's own directory:
 * relative, POSIX separators, no "..", no absolute paths. A trailing "/"
 * (directory reference, e.g. "assets/") is allowed.
 */
function isSafeRelativePath(p) {
  if (typeof p !== "string" || p.length === 0) return false;
  if (p.includes("\\") || p.includes("\0")) return false;
  const trimmed = p.endsWith("/") ? p.slice(0, -1) : p;
  if (trimmed.length === 0 || trimmed.startsWith("/")) return false;
  const segments = trimmed.split("/");
  return segments.every((s) => s !== "" && s !== "." && s !== "..");
}

function stripTrailingSlash(p) {
  return p.endsWith("/") ? p.slice(0, -1) : p;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function readRegistry(root) {
  const file = path.join(root, REGISTRY_FILE);
  try {
    if (!fs.existsSync(file)) {
      return { plugins: {} };
    }
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed.plugins !== "object" || parsed.plugins === null) {
      warn(`${file} has no "plugins" object; ignoring it`);
      return { plugins: {} };
    }
    return parsed;
  } catch (error) {
    warn(`Could not read ${file} (${error.message}); treating all plugins as enabled`);
    return { plugins: {} };
  }
}

function coerceSettingValue(raw, type) {
  if (type === "boolean") return raw === "true" || raw === true;
  if (type === "number") {
    const num = Number(raw);
    return Number.isNaN(num) ? undefined : num;
  }
  return raw;
}

/**
 * Resolution order per declared setting: registry value -> env var
 * (entry.env, falling back to the setting key) -> manifest default.
 */
function resolveSettings(manifest, registryEntry) {
  const resolved = {};
  for (const entry of asArray(manifest.settings)) {
    if (!entry || typeof entry.key !== "string" || entry.key.length === 0) {
      warn(`${manifest.id}: ignoring a settings entry without a "key"`);
      continue;
    }
    const registrySettings = (registryEntry && registryEntry.settings) || {};
    if (Object.prototype.hasOwnProperty.call(registrySettings, entry.key)) {
      resolved[entry.key] = registrySettings[entry.key];
      continue;
    }
    const envKey = entry.env || entry.key;
    if (process.env[envKey] !== undefined) {
      const coerced = coerceSettingValue(process.env[envKey], entry.type);
      if (coerced !== undefined) {
        resolved[entry.key] = coerced;
        continue;
      }
    }
    resolved[entry.key] = entry.default;
  }
  return resolved;
}

/**
 * Validate + normalize one manifest. Returns null (after warning) when the
 * plugin must be skipped. Recoverable problems (unknown slot name, missing
 * declared file) drop only the offending item.
 */
function normalizePlugin(root, dirName, manifest, registryEntry) {
  for (const field of REQUIRED_FIELDS) {
    if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
      warn(`${dirName}: manifest is missing required field "${field}"; skipping plugin`);
      return null;
    }
  }
  if (!ID_PATTERN.test(manifest.id)) {
    warn(`${dirName}: invalid plugin id "${manifest.id}"; skipping plugin`);
    return null;
  }
  if (manifest.id !== dirName) {
    warn(`${dirName}: manifest id "${manifest.id}" does not match its directory name; skipping plugin`);
    return null;
  }

  const declaredPaths = [
    ...asArray(manifest.hooks),
    ...Object.values(manifest.slots || {}).flatMap(asArray),
    ...Object.values(manifest.regions || {}).flatMap(asArray),
    ...asArray(manifest.styles),
    ...asArray(manifest.scripts),
    ...asArray(manifest.assets),
  ];
  for (const declared of declaredPaths) {
    if (!isSafeRelativePath(declared)) {
      warn(`${manifest.id}: unsafe path "${declared}" in manifest; skipping plugin`);
      return null;
    }
  }

  const pluginDir = path.join(root, dirName);
  const existingOnly = (paths, kind) =>
    paths.filter((p) => {
      if (fs.existsSync(path.join(pluginDir, stripTrailingSlash(p)))) return true;
      warn(`${manifest.id}: ${kind} file "${p}" does not exist; ignoring it`);
      return false;
    });

  const slots = {};
  for (const [slotName, files] of Object.entries(manifest.slots || {})) {
    if (!KNOWN_SLOTS.has(slotName)) {
      warn(`${manifest.id}: unknown slot "${slotName}"; ignoring it`);
      continue;
    }
    const existing = existingOnly(asArray(files), `slot "${slotName}"`);
    if (existing.length > 0) slots[slotName] = existing;
  }

  const regions = {};
  for (const [regionName, file] of Object.entries(manifest.regions || {})) {
    if (!KNOWN_REGIONS.has(regionName)) {
      warn(`${manifest.id}: unknown region "${regionName}"; ignoring it`);
      continue;
    }
    const [existing] = existingOnly(
      asArray(file).slice(0, 1),
      `region "${regionName}"`
    );
    if (existing) regions[regionName] = existing;
  }

  let hooksPath = null;
  if (manifest.hooks !== undefined) {
    const [hooks] = existingOnly(asArray(manifest.hooks).slice(0, 1), "hooks");
    hooksPath = hooks || null;
  }

  return {
    id: manifest.id,
    dir: pluginDir,
    manifest,
    slots,
    regions,
    hooksPath,
    styles: existingOnly(asArray(manifest.styles), "style"),
    scripts: existingOnly(asArray(manifest.scripts), "script"),
    assets: existingOnly(asArray(manifest.assets), "asset"),
    noteSettings: asArray(manifest.noteSettings).filter((s) => typeof s === "string" && s.length > 0),
    settings: resolveSettings(manifest, registryEntry),
    enabled: !registryEntry || registryEntry.enabled !== false,
  };
}

/**
 * Scan the plugins directory. Result is cached per root; pass force to
 * re-read (the _data file does this once per build so edits hot-reload).
 */
function loadPlugins({ force = false, root = PLUGINS_ROOT } = {}) {
  if (cache && cacheRoot === root && !force) {
    return cache;
  }

  const plugins = [];
  const errors = [];
  let dirNames = [];
  try {
    dirNames = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    // No plugins directory at all — a valid state.
    cache = { plugins: [], errors: [] };
    cacheRoot = root;
    return cache;
  }

  const registry = readRegistry(root);

  for (const dirName of dirNames) {
    const manifestPath = path.join(root, dirName, MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) {
      // Not a plugin directory (no manifest) — silently ignore.
      continue;
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      warn(`${dirName}: could not parse ${MANIFEST_FILE} (${error.message}); skipping plugin`);
      errors.push({ dir: dirName, message: error.message });
      continue;
    }
    const plugin = normalizePlugin(root, dirName, manifest, registry.plugins[manifest && manifest.id]);
    if (plugin) {
      plugins.push(plugin);
    } else {
      errors.push({ dir: dirName, message: "invalid manifest" });
    }
  }

  cache = { plugins, errors };
  cacheRoot = root;
  return cache;
}

function enabledPlugins(options) {
  return loadPlugins(options).plugins.filter((p) => p.enabled);
}

function hookContext(plugin) {
  return {
    settings: plugin.settings,
    manifest: plugin.manifest,
    pluginDir: path.resolve(plugin.dir),
  };
}

function requireHooks(plugin) {
  if (!plugin.hooksPath) return null;
  try {
    return require(path.resolve(plugin.dir, plugin.hooksPath));
  } catch (error) {
    warn(`${plugin.id}: could not load hooks "${plugin.hooksPath}" (${error.message}); ignoring hooks`);
    return null;
  }
}

/** Called from .eleventy.js as the last markdown-it .use() before userMarkdownSetup. */
function applyMarkdownHooks(md, options) {
  for (const plugin of enabledPlugins(options)) {
    const hooks = requireHooks(plugin);
    if (!hooks || typeof hooks.setupMarkdown !== "function") continue;
    try {
      hooks.setupMarkdown(md, hookContext(plugin));
    } catch (error) {
      warn(`${plugin.id}: setupMarkdown failed (${error.message}); skipping it`);
    }
  }
}

/**
 * Compile a plugin's declared .scss styles to dist. Uses the sass JS API
 * per file (instead of adding src/plugins to the sass CLI invocation) so a
 * syntax error in one third-party stylesheet warns instead of failing the
 * whole build, and disabled plugins aren't compiled at all.
 */
function compilePluginStyles(options) {
  const stylePlugins = enabledPlugins(options).filter((p) =>
    p.styles.some((s) => s.endsWith(".scss"))
  );
  if (stylePlugins.length === 0) return;

  const sass = require("sass");
  for (const plugin of stylePlugins) {
    for (const style of plugin.styles) {
      if (!style.endsWith(".scss") || path.basename(style).startsWith("_")) continue;
      const source = path.join(plugin.dir, style);
      const target = path.join(
        OUTPUT_ROOT,
        "plugins",
        plugin.id,
        style.replace(/\.scss$/, ".css")
      );
      try {
        const result = sass.compile(source, { style: "compressed" });
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, result.css);
      } catch (error) {
        warn(`${plugin.id}: could not compile ${style} (${error.message}); skipping it`);
      }
    }
  }
}

/**
 * Copy every enabled plugin's slot templates into INCLUDES_ROOT so layouts
 * can render them with {% include %} (full data cascade, no async-shortcode
 * ordering issues). Files are only written when their content changed so a
 * no-op sync never retriggers the dev-server watcher; orphans (removed or
 * disabled plugins) are deleted.
 */
function syncSlotTemplates(options) {
  const includesRoot = (options && options.includesRoot) || INCLUDES_ROOT;
  try {
    loadPlugins({ ...(options || {}), force: true });

    const expected = new Map();
    for (const plugin of enabledPlugins(options)) {
      const files = [
        ...Object.values(plugin.slots).flat(),
        ...Object.values(plugin.regions),
      ];
      for (const file of files) {
        expected.set(path.join(plugin.id, file), path.join(plugin.dir, file));
      }
    }

    for (const [relative, source] of expected) {
      const target = path.join(includesRoot, relative);
      const content = fs.readFileSync(source);
      let existing = null;
      try {
        existing = fs.readFileSync(target);
      } catch {
        // Not synced yet.
      }
      if (!existing || !existing.equals(content)) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
    }

    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : [path.join(dir, entry.name)]
      );
    let existingFiles = [];
    try {
      existingFiles = walk(includesRoot);
    } catch {
      // Directory doesn't exist yet.
    }
    for (const file of existingFiles) {
      if (!expected.has(path.relative(includesRoot, file))) {
        fs.rmSync(file);
        const dir = path.dirname(file);
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
          fs.rmdirSync(dir);
        }
      }
    }
  } catch (error) {
    warn(`Could not sync slot templates (${error.message})`);
  }
}

/** Called from .eleventy.js right before userEleventySetup. */
function applyEleventyHooks(eleventyConfig, options) {
  const root = (options && options.root) || PLUGINS_ROOT;
  eleventyConfig.addWatchTarget(`./${root}/`);
  eleventyConfig.on("eleventy.before", () => syncSlotTemplates(options));
  eleventyConfig.on("eleventy.after", () => compilePluginStyles(options));

  for (const plugin of enabledPlugins(options)) {
    const passthrough = [
      ...plugin.styles.filter((s) => s.endsWith(".css")),
      ...plugin.scripts,
      ...plugin.assets,
    ];
    for (const p of passthrough) {
      const relative = stripTrailingSlash(p);
      eleventyConfig.addPassthroughCopy({
        [`${root}/${plugin.id}/${relative}`]: `plugins/${plugin.id}/${relative}`,
      });
    }

    const hooks = requireHooks(plugin);
    if (!hooks || typeof hooks.setupEleventy !== "function") continue;
    try {
      hooks.setupEleventy(eleventyConfig, hookContext(plugin));
    } catch (error) {
      warn(`${plugin.id}: setupEleventy failed (${error.message}); skipping it`);
    }
  }
}

/** Extra per-note setting keys declared by enabled plugins (see notes.11tydata.js). */
function getNoteSettingKeys(options) {
  const keys = new Set();
  for (const plugin of enabledPlugins(options)) {
    for (const key of plugin.noteSettings) keys.add(key);
  }
  return [...keys];
}

/**
 * The curated view exposed to templates as the `plugins` global
 * (src/site/_data/plugins.js). Slot files are include paths relative to
 * src/site/_includes, pointing at the copies written by syncSlotTemplates.
 */
function getTemplateData(options) {
  const data = {
    enabled: [],
    slots: {},
    regions: {},
    styles: [],
    scripts: [],
    settings: {},
  };

  for (const plugin of enabledPlugins(options)) {
    data.enabled.push(plugin.id);
    data.settings[plugin.id] = plugin.settings;

    for (const [slotName, files] of Object.entries(plugin.slots)) {
      if (!data.slots[slotName]) data.slots[slotName] = [];
      for (const file of files) {
        data.slots[slotName].push({
          file: `plugins/${plugin.id}/${file}`,
          pluginId: plugin.id,
        });
      }
    }

    for (const [regionName, file] of Object.entries(plugin.regions)) {
      if (data.regions[regionName]) {
        warn(
          `${plugin.id}: region "${regionName}" is already provided by ` +
            `${data.regions[regionName].pluginId}; ignoring this plugin's template`
        );
        continue;
      }
      data.regions[regionName] = {
        file: `plugins/${plugin.id}/${file}`,
        pluginId: plugin.id,
      };
    }

    for (const style of plugin.styles) {
      if (path.basename(style).startsWith("_")) continue;
      data.styles.push(`/plugins/${plugin.id}/${style.replace(/\.scss$/, ".css")}`);
    }
    for (const script of plugin.scripts) {
      data.scripts.push(`/plugins/${plugin.id}/${script}`);
    }
  }

  return data;
}

module.exports = {
  loadPlugins,
  applyMarkdownHooks,
  applyEleventyHooks,
  syncSlotTemplates,
  getNoteSettingKeys,
  getTemplateData,
  KNOWN_SLOTS,
};
