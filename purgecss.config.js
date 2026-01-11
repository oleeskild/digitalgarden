module.exports = {
  content: ['./dist/**/*.html', './dist/**/*.js'],
  css: ['./dist/**/*.css'],

  // Only safelist classes that are dynamically added by JavaScript at runtime
  // Everything else is in the static HTML and will be detected automatically
  safelist: {
    standard: [
      // Callout toggle (calloutScript.njk)
      'is-collapsed',

      // Footnote/reference highlighting (references.njk, linkPreview.njk)
      'referred',

      // Canvas states (canvasScript.njk)
      'hidden',
      'small-scale',

      // Search UI states (searchScript.njk)
      'active',
      'has-content',
      'no-preview',
      'search-highlight',
    ],
  },

  // Keep CSS variables, keyframes, and font-faces
  variables: true,
  keyframes: true,
  fontFace: true,
};
