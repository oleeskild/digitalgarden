# Garden plugin installer — specification

This is the contract for anything that installs garden plugins into a
user's garden: the Obsidian plugin (to be built into the rewrite), the
Forestry dashboard, or any other tool. The template side (loader, manifest
format, slots) is implemented in this repo — see `docs/PLUGINS.md`.

Design principles:

1. **A plugin is a public GitHub repo** with `garden-plugin.json` at its
   root. Installation = fetching files and committing them into the
   garden repo. Nothing more.
2. **Never execute plugin code at install time.** No install hooks, no
   postinstall scripts. Code only runs when the site builds.
3. **Warn before installing.** Plugins run arbitrary code in the user's
   site build and in visitors' browsers. Show a security notice naming
   the repo and author, and require explicit confirmation.
4. **The same code path serves self-hosted and Forestry gardens.**
   Forestry exposes a GitHub-REST-compatible API (the existing Octokit
   connection), so every operation below works identically on both.

## Install (from a pasted GitHub URL or a registry entry)

Input: a GitHub URL in any common shape — `https://github.com/user/repo`,
`user/repo`, with or without `.git`.

1. **Resolve a ref.** Prefer the latest release tag
   (`GET /repos/{owner}/{repo}/releases/latest`); fall back to the default
   branch when the repo has no releases. Record the resolved ref.
2. **Fetch the tree** at that ref (`GET /repos/.../git/trees/{ref}?recursive=1`,
   unauthenticated Octokit — same as the existing template updater).
3. **Read and validate `garden-plugin.json`** from the tree root:
   - required fields: `id`, `name`, `version`, `description`, `author`
   - `id` matches `^[a-z0-9][a-z0-9-]*$` and is not already installed
     (offer "update" instead when it is)
   - every declared path (hooks, slots values, styles, scripts, assets) is
     relative, uses `/` separators, and contains no `..`, no leading `/`,
     no `\` — reject the plugin otherwise
   - reject ids starting with `dg-` (reserved for first-party plugins
     shipped with the template)
   - size caps (recommended: 2 MB per file, 10 MB per plugin) to keep
     garden repos lean
4. **Show the security notice** (repo, author, description) and require
   confirmation.
5. **Write the files.** Copy the plugin repo's files verbatim to
   `src/plugins/<id>/...` in the garden repo (respecting the garden's
   `contentBaseDir` prefix on self-hosted setups). Skip repo metadata
   that has no runtime purpose (`.git*`, `.github/`) but always include
   `garden-plugin.json`. Use the existing batch-commit path
   (blobs → tree → commit) so the install is one commit.
6. **Update the registry** (read-modify-write, like
   `navigationOrder.json` today): fetch `src/plugins/plugins.json`, merge
   the new entry, write it back.

## Registry — `src/plugins/plugins.json`

User-owned; must never appear in `plugin-info.json`'s file lists.

```jsonc
{
  "version": 1,
  "plugins": {
    "some-plugin": {
      "repo": "author/garden-plugin-foo",
      "installedVersion": "1.2.0",      // manifest version at install time
      "installedRef": "v1.2.0",         // git ref actually fetched
      "installedAt": "2026-08-28T12:00:00Z",
      "enabled": true,
      "settings": { "label": "Hi" },    // values for manifest-declared settings
      "files": [                        // exact files written — for clean uninstall
        "src/plugins/some-plugin/garden-plugin.json",
        "src/plugins/some-plugin/index.js"
      ]
    },
    "dg-search": { "enabled": false }   // first-party plugins get sparse entries
  }
}
```

Loader semantics (already implemented): a plugin directory with a valid
manifest is enabled unless its entry says `"enabled": false`; a missing
registry or missing entry means enabled. The loader parses the file
defensively — a malformed registry degrades to "everything enabled", it
never fails a build.

## Enable / disable

Toggle `enabled` in the registry entry (create a sparse entry when none
exists — this is how the shipped `dg-*` plugins are disabled). One-line
change, one commit, no file moves.

## Update

1. Resolve the latest ref as in install; compare with `installedRef` (or
   compare file blob SHAs, as the template updater does).
2. Re-validate the manifest at the new ref (same rules as install).
3. Write changed/new files, delete files present in the old `files` list
   but absent from the new tree, then update the registry entry
   (`installedVersion`, `installedRef`, `files`).

## Uninstall

Delete every path in the entry's `files` list (fall back to deleting
`src/plugins/<id>/` recursively when the list is missing), then remove
the registry entry. Settings die with the entry.

## Settings UI — the "Plugins" section

The current settings tab's **"Features"** section (the "Default Note
Settings" / "Global Note Settings" toggle modal) is replaced by a section
named **"Plugins"**.

**Enumerate installed plugins from the garden repo, not from local
state.** The repo is the source of truth: fetch the garden's git tree,
find `src/plugins/*/garden-plugin.json`, and parse each manifest (merge in
`src/plugins/plugins.json` for enabled state and stored settings). This
way the list is always correct across devices, after manual installs
someone made by dropping a directory into the repo, and on Forestry —
no local cache to drift.

Each enumerated plugin renders as a row:

- name, version, description, author (from its manifest), with a
  first-party badge for `dg-*` plugins
- an **enable/disable toggle** → writes `enabled` in the registry entry
- a **settings** control when the manifest declares `settings` → the
  generic form below
- **update** / **uninstall** actions for community plugins (not `dg-*`,
  which the template updater manages)

Below the plugin list: the **install entry points** — a "Browse community
plugins" grid (see Community registry) and an "Install from GitHub URL"
input feeding the install flow above.

Core toggles that are not yet plugins (`dgShowFileTree`,
`dgShowBacklinks`, `dgShowLocalGraph`, `dgShowToc`, `dgShowTags`,
`dgShowInlineTitle`, …) move to a slimmed "Display" group for now; the
long-term direction is to extract them into plugins too, shrinking that
group until the Plugins section is the whole story.

### Per-plugin settings form

Render the manifest's `settings` array generically:

| type | control |
|---|---|
| `text` | text input |
| `boolean` | toggle |
| `number` | number input |
| `select` | dropdown over `options` |

Store values under the registry entry's `settings` map. The template
resolves: registry value → env var (`env` field, or the key) → manifest
default. `noteSettings` keys need no UI work: the template merges them
into the standard per-note flag resolution, and the frontmatter override
(`dg-kebab-case`) comes for free once the key is also added to the
Obsidian plugin's `defaultNoteSettings` record on install.

## Community registry

A `digitalgarden-plugins` repo (planned: `oleeskild/digitalgarden-plugins`)
holds the community list, mirroring how Obsidian's
`obsidian-releases/community-css-themes.json` powers the existing theme
picker. Plugin authors submit a PR adding one entry:

```jsonc
// community-plugins.json — an array, one entry per plugin
[
  {
    "id": "giscus-comments",            // must equal the manifest id
    "name": "Giscus Comments",
    "author": "Jane Gardener",
    "description": "GitHub-discussions-backed comments under every note.",
    "repo": "janegardener/garden-plugin-giscus",  // owner/name
    "screenshot": "screenshot.png"      // optional, path within the repo
  }
]
```

Consumers fetch the raw JSON and render a browse grid exactly like the
theme picker does today (cards, screenshot from
`https://raw.githubusercontent.com/{repo}/HEAD/{screenshot}`, search box);
"install" feeds the entry's `repo` into the install flow above. The same
JSON can drive a public directory website later (à la omarchyplugins.com).

Review bar for registry PRs: manifest validates, id unique, no obviously
malicious code. The registry is a directory, not an endorsement — the
install-time security notice still applies.

## Error handling

- Build-side failures are already tolerant (loader warns and skips).
- Installer-side: any validation failure aborts before the first write;
  a partial multi-file write is avoided by using the batch commit API.
- On Forestry, surface the existing limit errors (`build_limit_reached`,
  `storage_limit_exceeded`) as usual.
