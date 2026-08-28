# Garden plugins — author guide

A garden plugin is a directory of files that extends a digital garden:
extra markup in well-defined slots, site-wide styles and scripts, and
build-time hooks into Eleventy and markdown-it. Plugins are distributed as
GitHub repos and installed into `src/plugins/<id>/` in a garden repo.
Everything under `src/plugins/` (except the first-party `dg-*` plugins that
ship with the template) is invisible to template updates, so installed
plugins survive them untouched.

The template's own search, link preview, timestamps, and math features are
plugins built on this API — read them as reference implementations:

- [`src/plugins/dg-link-preview/`](../src/plugins/dg-link-preview/) — the minimal example: one slot template, one per-note setting.
- [`src/plugins/dg-timestamps/`](../src/plugins/dg-timestamps/) — slot templates + declared settings with env fallbacks.
- [`src/plugins/dg-math/`](../src/plugins/dg-math/) — a markdown-it hook, no templates.
- [`src/plugins/dg-search/`](../src/plugins/dg-search/) — the full toolkit: Eleventy hooks, filters, a virtual template, multiple slots.

## Anatomy

```
my-plugin/
  garden-plugin.json     required manifest (see below)
  index.js               optional build-time hooks
  templates/*.njk        slot templates
  styles/*.scss|css      site-wide styles
  assets/*               client scripts, images, ...
```

Only `garden-plugin.json` is required, and only at a fixed name and place
(the plugin root). Everything else is declared by the manifest, with paths
relative to the plugin root. All layout on disk beyond that is convention.

## Manifest — `garden-plugin.json`

```jsonc
{
  "id": "my-plugin",             // required: ^[a-z0-9][a-z0-9-]*$, must equal the directory name
  "name": "My Plugin",           // required
  "version": "1.0.0",            // required
  "description": "What it does", // required
  "author": "You",               // required
  "minTemplateVersion": "x.y.z", // optional; the loader warns on mismatch, never fails

  "hooks": "index.js",           // optional Node entry point (see Hooks)

  "slots": {                     // optional: slot name -> template file(s)
    "notes.footer": "templates/thing.njk",
    "common.head": ["templates/a.njk", "templates/b.njk"]
  },

  "styles": ["styles/main.scss"],   // optional: .scss is compiled, .css copied as-is
  "scripts": ["assets/client.js"],  // optional: copied + loaded with <script defer>
  "assets": ["assets/img/"],        // optional: copied to the site, nothing else

  "settings": [                  // optional: user-facing settings (see Settings)
    {
      "key": "label",
      "name": "Label",
      "description": "Shown under the note",
      "type": "text",            // "text" | "boolean" | "number" | "select"
      "default": "Hello",
      "options": ["a", "b"],     // select only
      "env": "MY_PLUGIN_LABEL"   // optional env var consulted when no stored value exists
    }
  ],

  "noteSettings": ["dgMyFlag"]   // optional per-note boolean flags (see Per-note settings)
}
```

Path rules, enforced on every declared path: relative, `/` separators, no
`..`, no leading `/`, no `\`. A violation skips the whole plugin (with a
console warning); a missing declared file or unknown slot name skips just
that item. **A broken plugin never fails the build.**

## Slots

A slot is a named position in the site layout. The loader copies your slot
templates into `src/site/_includes/plugins/<id>/` (generated, gitignored)
and the layouts render them with a plain `{% include %}` — so slot
templates get the **full Eleventy data cascade**: `meta`, `settings`,
`title`, `tags`, `created`, `updated`, `content`, `collections`, `graph`,
`filetree`, `page`, everything. In addition, `pluginSettings` holds your
plugin's own resolved settings values.

| Slot | Where it renders |
|---|---|
| `common.head` / `notes.head` / `index.head` | inside `<head>` (all pages / note pages / the home page) |
| `common.header` / `notes.header` / `index.header` | inside `<header>`, after the title and tags |
| `common.beforeContent` / `notes.beforeContent` / `index.beforeContent` | inside `<main>`, before the note content |
| `common.afterContent` / `notes.afterContent` / `index.afterContent` | inside `<main>`, after the note content |
| `common.footer` / `notes.footer` / `index.footer` | end of `<body>` |
| `navbar.actions` | in the navbar (and the mobile filetree navbar) — where the search button lives |
| `filetree.actions` | in the filetree sidebar, below the site title |
| `filetree.beforeTitle` / `filetree.afterTitle` | around the site title in the filetree |
| `sidebar.top` / `sidebar.bottom` | top/bottom of the right-hand sidebar |

Ordering within a slot: plugins alphabetically by id, files in manifest
order — and user components (`src/site/_includes/components/user/…`)
always render *after* plugin output, so site owners keep the last word.

Slot templates are plain Nunjucks fragments: no front matter, and they
should gate themselves on their own settings (e.g.
`{% if settings.dgMyFlag === true %}…{% endif %}`), because the loader
renders every enabled plugin's slots unconditionally.

## Hooks — `index.js`

```js
module.exports = {
  // Both optional. context = { settings, manifest, pluginDir }
  setupMarkdown(md, context) {
    // Last .use()s on the markdown-it chain (before the user's own
    // userMarkdownSetup — user code always runs last).
    md.use(require("markdown-it-something"));
  },
  setupEleventy(eleventyConfig, context) {
    // Runs just before userEleventySetup. Anything the Eleventy config
    // API offers: addFilter, addShortcode, addTransform, addTemplate,
    // addPassthroughCopy, on("eleventy.after", ...), ...
  },
};
```

- Hook code runs at **config time**, in Node, with the same privileges as
  the build itself. It may `require` any dependency the template already
  ships (see `package.json`) or pure-JS files vendored inside the plugin
  directory. Plugins cannot add npm dependencies of their own.
- To emit a *page* (like dg-search's `/searchIndex.json`), read a template
  file from `context.pluginDir` and register it with
  `eleventyConfig.addTemplate(...)` — virtual templates join the data
  cascade and can use `collections`.
- Exceptions thrown by a hook are caught, warned about, and skipped.

## Settings

Each `settings` entry resolves, in order:

1. the value stored for your plugin in `src/plugins/plugins.json`
   (written by the installer UI),
2. the env var named by `env` (or the key itself) from the garden's
   `.env` — `"true"`/`"false"` are coerced for boolean settings,
3. the manifest `default`.

Resolved values are available as `pluginSettings.<key>` in your slot
templates and `context.settings.<key>` in hooks. The `env` field exists so
a plugin can adopt a setting the template already exposes (dg-timestamps
reads the long-standing `SHOW_CREATED_TIMESTAMP` this way).

## Per-note settings

Keys listed in `noteSettings` (camelCase, conventionally `dg`-prefixed)
join the template's standard note-setting resolution: the env var of the
same name is the global default, and a note's frontmatter (`dg-my-flag`)
overrides it per note. The resolved value lands in `settings.<key>`,
available in every slot template.

## Styles, scripts, assets

- `styles`: `.scss` files are compiled (per file, `_partials` skipped) to
  `/plugins/<id>/<path>.css` and linked in `<head>`; `.css` files are
  copied and linked as-is. A Sass error warns and skips that file only.
- `scripts`: copied to `/plugins/<id>/<path>` and loaded with
  `<script defer>` in `<head>`.
- `assets`: copied to `/plugins/<id>/<path>`, nothing referenced
  automatically — for images, fonts, or files your own code fetches.

## Enable, disable, state

`src/plugins/plugins.json` is the user-owned state file (never touched by
template updates — see `docs/PLUGIN_INSTALLER_SPEC.md` for the full
schema). The rule is simple: every directory under `src/plugins/` with a
valid manifest is **enabled unless** its registry entry says
`"enabled": false`. No registry file at all means everything on disk runs
— which is why a hand-dropped plugin directory Just Works.

## Developing with an AI agent

The template ships an agent skill at
[`skills/garden-plugin-author/`](../skills/garden-plugin-author/SKILL.md)
in the open [Agent Skills](https://skills.sh) format, containing
everything an agent needs to scaffold, test, and publish a plugin.
Install it into any harness (Claude Code, Cursor, Codex, …) with
`npx skills add oleeskild/digitalgarden`, then ask the agent to "create a
garden plugin that …". Manual install also works: copy the folder into
your agent's skill directory (e.g. `~/.claude/skills/`).

## Developing a plugin

1. Clone the [template](https://github.com/oleeskild/digitalgarden) and
   `npm install`.
2. `mkdir -p src/plugins/my-plugin` and add a `garden-plugin.json`.
3. `npm run dev` — slot template, style, and `plugins.json` edits
   hot-reload. Changes to hooks (`index.js`) or newly added/removed
   plugins need a dev-server restart, because hooks register at config
   time.
4. Watch the build log: every problem the loader finds is reported as a
   `[plugins] …` warning.
5. Publish the plugin directory as a GitHub repo with `garden-plugin.json`
   at the repo root. Tag releases (`v1.0.0`) — installers prefer the
   latest release tag over the default branch.

## Security

Installing a plugin means running its code — hooks execute in the build
(on Netlify/Vercel/Forestry with access to build env vars), and its
scripts run in every visitor's browser. Installers must never execute
plugin code at install time, and users should only install plugins from
authors they trust, ideally after reading the code. Keep your own plugins
small and auditable.
