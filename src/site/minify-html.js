const htmlMinifier = require("html-minifier-terser");

const productionHtmlMinifierOptions = {
  useShortDoctype: true,
  removeComments: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  preserveLineBreaks: true,
  // MathJax embeds CSS nesting in inline <style> tags. html-minifier-terser's
  // CSS optimizer flattens that nesting incorrectly and moves the assistive
  // MathML color onto the SVG wrapper, making currentColor paths invisible.
  minifyCSS: false,
  minifyJS: true,
  keepClosingSlash: true,
};

function minifyProductionHtml(content) {
  return htmlMinifier.minify(content, productionHtmlMinifierOptions);
}

module.exports = {
  minifyProductionHtml,
  productionHtmlMinifierOptions,
};
