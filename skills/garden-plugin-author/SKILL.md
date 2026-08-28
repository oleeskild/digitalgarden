---
name: garden-plugin-author
description: Create, test, and publish plugins for the Digital Garden Eleventy template (oleeskild/digitalgarden, used by the obsidian-digital-garden plugin and Forestry.md). Use when asked to build a garden plugin, add a feature to a digital garden as a plugin, write or edit a garden-plugin.json manifest, or publish a plugin to the community registry.
---

# Authoring a Digital Garden plugin

A garden plugin is a directory that extends a Digital Garden site: markup
injected into named layout slots, site-wide styles/scripts, and build-time
Eleventy/markdown-it hooks. Plugins are distributed as public GitHub repos
with a `garden-plugin.json` manifest at the repo root, and installed into
`src/plugins/<id>/` of a garden repo. Follow this skill end to end; do not
invent extension points that are not listed here.

## Where to work

- **Inside a garden or template checkout** (a repo with `.eleventy.js` and
  `src/site/`): create your plugin directly at `src/plugins/<id>/` and it
  runs immediately.
- **Standalone plugin repo**: develop the plugin as its own directory, and
  for testing clone https://github.com/oleeskild/digitalgarden, run
  `npm install`, and symlink or copy your plugin into `src/plugins/<id>/`.

The plugin id must match `^[a-z0-9][a-z0-9-]*$`, must equal the directory
name, and must NOT start with `dg-` (reserved for first-party plugins).

## Minimal viable plugin

```
src/plugins/reading-time/
  garden-plugin.json
  templates/badge.njk
```

```json
{
  "id": "reading-time",
  "name": "Reading Time",
  "version": "1.0.0",
  "description": "Shows an estimated reading time under the note title.",
  "author": "Your Name",
  "slots": { "notes.header": "templates/badge.njk" },
  "noteSettings": ["dgReadingTime"]
}
```

```njk
{% if settings.dgReadingTime === true %}
<div class="reading-time">{{ ((content | striptags).split(" ").length / 200) | round }} min read</div>
{% endif %}
```

`id`, `name`, `version`, `description`, `author` are required. Everything
else is optional. All declared paths must be relative, use `/`, and
contain no `..` — a violation makes the loader (and installers) reject
the plugin.

## Slots

Slot templates are plain Nunjucks fragments (no front matter). They are
rendered with the **full Eleventy data cascade** — `meta`, `settings`,
`title`, `tags`, `created`, `updated`, `content`, `collections`, `graph`,
`filetree`, `page` — plus `pluginSettings` (this plugin's resolved
settings). Always self-gate on your own setting: every enabled plugin's
slots render unconditionally.

| Slot | Renders |
|---|---|
| `common.head` / `notes.head` / `index.head` | in `<head>` (all pages / notes / home page) |
| `common.header` / `notes.header` / `index.header` | in `<header>` after title and tags |
| `common.beforeContent` / `notes.beforeContent` / `index.beforeContent` | in `<main>` before the content |
| `common.afterContent` / `notes.afterContent` / `index.afterContent` | in `<main>` after the content |
| `common.footer` / `notes.footer` / `index.footer` | end of `<body>` (scripts, overlays, tooltips) |
| `navbar.actions` | navbar, where the search button sits |
| `filetree.actions` | filetree sidebar below the site title |
| `filetree.beforeTitle` / `filetree.afterTitle` | around the filetree site title |
| `sidebar.top` / `sidebar.bottom` | right-hand sidebar |

Manifest form: `"slots": { "<slot>": "file.njk" }` or a list of files.
Use `common.footer` for anything with a `<script>` or overlay markup.

## Regions (exclusive replacement)

A region replaces a core UI area instead of adding to it — at most one
enabled plugin provides each region (first by id wins; conflicts warn).
Currently: `navigation` (default: the core navbar; the shipped
`dg-filetree` plugin claims it to render the folder-tree sidebar).

```jsonc
"regions": { "navigation": "templates/my-nav.njk" }
```

A custom navigation plugin gets the full data cascade, including the
core-computed `filetree` data structure, and may include core components
(e.g. fall back to `{% include "components/navbar.njk" %}`) and render
sub-slots via `components/pluginSlot.njk`. Users switch navigations by
disabling `dg-filetree` and enabling yours. Read
`src/plugins/dg-filetree/` in the template as the reference.

A navigation plugin MUST render the surfaces other extensions rely on,
in its own markup: the `navbar.actions` and `filetree.actions` plugin
slots (the search button lives there), and the site owner's custom
filetree components —
`{% for imp in dynamics.filetree.beforeTitle %}{% include imp %}{% endfor %}`
plus the same for `dynamics.filetree.afterTitle`. `dg-filetree` does
both; copy its template as the starting point.

## Build hooks (`"hooks": "index.js"`)

```js
module.exports = {
  // Both optional. context = { settings, manifest, pluginDir }
  setupMarkdown(md, context) { md.use(require("markdown-it-footnote")); },
  setupEleventy(eleventyConfig, context) {
    eleventyConfig.addFilter("myFilter", (v) => v);
    // To emit a page (needs collections), register a virtual template:
    // eleventyConfig.addTemplate("my-page.njk",
    //   require("fs").readFileSync(require("path").join(context.pluginDir, "templates/page.njk"), "utf8"),
    //   { permalink: "/my-page.json", eleventyExcludeFromCollections: true });
  },
};
```

Rules: hooks run at config time in Node; they may only `require` packages
the template already ships (check the template's `package.json`) or pure
JS files vendored inside the plugin dir — plugins cannot add npm
dependencies. Hook changes need a dev-server restart. Thrown errors are
caught and the hook is skipped with a `[plugins]` warning.

## Settings and per-note flags

```json
"settings": [
  { "key": "label", "name": "Label", "description": "…",
    "type": "text",              // text | boolean | number | select
    "default": "Hello",
    "options": ["a", "b"],       // select only
    "env": "MY_ENV_VAR" }        // optional env fallback
],
"noteSettings": ["dgMyFlag"]
```

- Setting resolution: stored value in `src/plugins/plugins.json` → env var
  (`env` or the key) from the garden's `.env` → `default`. Read them as
  `pluginSettings.<key>` in templates, `context.settings.<key>` in hooks.
- `noteSettings` keys (camelCase, `dg`-prefixed by convention) resolve
  like core note settings: env var of the same name is the global default,
  a note's frontmatter `dg-my-flag: true/false` overrides per note. Read
  as `settings.<key>` in templates.

## Styles, scripts, assets

- `"styles": ["styles/x.scss"]` — `.scss` compiled per file (`_partials`
  skipped) to `/plugins/<id>/styles/x.css` and linked in `<head>`; plain
  `.css` copied and linked as-is. Prefer the garden's `--dg-*` CSS
  variables for colors/spacing so themes keep working.
- `"scripts": ["assets/client.js"]` — copied and loaded via
  `<script defer>` in `<head>`.
- `"assets": ["assets/"]` — copied to `/plugins/<id>/…`, referenced only
  by your own code.

## Test before publishing

From the template/garden checkout:

1. `npm install` once, then `npm run dev` — slot template, style, and
   `plugins.json` edits hot-reload; restart after hook or manifest
   changes.
2. Watch for `[plugins] …` warnings in the build log — each one is a
   manifest or runtime problem in your plugin.
3. Build once with the plugin disabled
   (`src/plugins/plugins.json` → `{"plugins": {"<id>": {"enabled": false}}}`)
   and confirm the site is unchanged.
4. If the template has a test suite, `npm test` must stay green.

## Publish

1. Put the plugin at the **root** of a public GitHub repo
   (`garden-plugin.json` at top level). Suggested repo name:
   `garden-plugin-<id>`.
2. Add a README (what it does, a screenshot, settings) and a screenshot
   file — the community directory shows it.
3. Tag a release matching the manifest version: `git tag v1.0.0 && git push --tags`.
   Installers fetch the latest release tag, falling back to the default
   branch only when no release exists. Every future change: bump
   `version`, tag again.
4. Users can now install it by pasting the repo URL, or manually by
   copying the directory into `src/plugins/<id>/`.
5. To list it in the community directory, open a PR against
   `oleeskild/digitalgarden-plugins` adding one entry to
   `community-plugins.json`:
   `{ "id": "<id>", "name": "…", "author": "…", "description": "…", "repo": "you/garden-plugin-<id>", "screenshot": "screenshot.png" }`.

## Hard rules

- Never require install-time execution: no postinstall steps, no "run
  this script to finish setup". Installation is file copying only.
- A plugin must never break the build when misconfigured — the loader
  warns and skips, but keep your own code defensive too.
- Don't touch files outside your plugin directory or claim another
  plugin's id. Don't use the `dg-` prefix.
- Plugin code runs in the site build and in visitors' browsers — keep it
  small, readable, and dependency-light so users can audit it.

For deeper reference, read the first-party plugins under `src/plugins/`
in the template repo — `dg-link-preview` is the smallest, `dg-search`
the most complete, and `dg-filetree` the navigation reference.
