module.exports = {
  content: ['./dist/**/*.html', './dist/**/*.js'],
  css: ['./dist/**/*.css'],

  // Safelist patterns to preserve dynamic/runtime classes
  safelist: {
    // Exact class names to always keep
    standard: [
      'active',
      'hidden',
      'visible',
      'open',
      'closed',
      'expanded',
      'collapsed',
      'show',
      'hide',
      'loading',
      'loaded',
      'error',
      'success',
      'warning',
      'info',
      'dark',
      'light',
    ],

    // Regex patterns - keeps matching selectors
    deep: [
      // Theme classes
      /^theme-/,
      /^\.theme-/,

      // State classes (is-*)
      /^is-/,
      /^\.is-/,

      // Modifier classes (mod-*)
      /^mod-/,
      /^\.mod-/,

      // CodeMirror classes
      /^cm-/,
      /^\.cm-/,

      // HyperMD classes
      /^HyperMD-/,
      /^\.HyperMD-/,

      // Callouts
      /^callout/,
      /^\.callout/,
      /data-callout/,

      // Canvas
      /^canvas-/,
      /^\.canvas-/,

      // Graph
      /^graph-/,
      /^\.graph-/,

      // Dataview
      /^dataview/,
      /^\.dataview/,
      /^block-language-/,
      /^\.block-language-/,

      // Navigation/Tree
      /^nav-/,
      /^\.nav-/,
      /^tree-/,
      /^\.tree-/,
      /^filetree/,
      /^\.filetree/,

      // Markdown related
      /^markdown-/,
      /^\.markdown-/,

      // Table related
      /^table-/,
      /^\.table-/,

      // Backlinks
      /^backlink/,
      /^\.backlink/,

      // Lucide icons
      /^lucide/,
      /^\.lucide/,

      // MathJax
      /^mjx-/,
      /^\.mjx-/,
      /^MathJax/,
      /^\.MathJax/,

      // PDF viewer
      /^pdf/,
      /^\.pdf/,
      /^annotation/,
      /^\.annotation/,
      /^textLayer/,
      /^\.textLayer/,

      // Mermaid diagrams
      /^mermaid/,
      /^\.mermaid/,

      // Search
      /^search-/,
      /^\.search-/,

      // Sidebar
      /^sidebar/,
      /^\.sidebar/,

      // TOC
      /^toc/,
      /^\.toc/,

      // Tags
      /^tag/,
      /^\.tag/,

      // Bases (Obsidian)
      /^bases-/,
      /^\.bases-/,

      // Code highlighting (Prism/highlight.js)
      /^token/,
      /^\.token/,
      /^hljs/,
      /^\.hljs/,
      /^language-/,
      /^\.language-/,

      // Embeds
      /^embed/,
      /^\.embed/,

      // Internal links
      /^internal-/,
      /^\.internal-/,
      /^external-/,
      /^\.external-/,

      // Folder/file tree
      /^folder/,
      /^\.folder/,
      /^file/,
      /^\.file/,

      // Inline fields
      /^inline-field/,
      /^\.inline-field/,

      // Note icons
      /note-icon/,
      /\.note-icon/,
    ],

    // Greedy patterns - keeps selectors that contain the pattern anywhere
    greedy: [
      // Dynamic state suffixes
      /active/,
      /selected/,
      /focused/,
      /disabled/,
      /enabled/,
      /collapsed/,
      /expanded/,
      /hidden/,
      /visible/,
      /loading/,
      /error/,
      /dragging/,
      /hover/,
    ],
  },

  // Variables and keyframes to keep
  variables: true,
  keyframes: true,
  fontFace: true,

  // Block list - never remove these selectors
  blocklist: [],

  // Default extractor for HTML content
  defaultExtractor: content => {
    // Include classes from data attributes and standard class usage
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
    const innerMatches = content.match(/[^<>"'`\s.#]+/g) || [];
    return broadMatches.concat(innerMatches);
  },
};
