module.exports = {
  setupMarkdown(md) {
    md.use(require("markdown-it-mathjax3"), {
      tex: {
        inlineMath: [["$", "$"]],
      },
      options: {
        skipHtmlTags: { "[-]": ["pre"] },
      },
    });

    // mathjax-full 3.2.2 throws on characters outside its operator
    // dictionary (e.g. "€") — a stray $...€...$ span in prose would
    // otherwise abort the entire build. Fall back to the raw text.
    for (const rule of ["math_inline", "math_block"]) {
      const original = md.renderer.rules[rule];
      if (!original) continue;
      md.renderer.rules[rule] = function (tokens, idx, options, env, self) {
        try {
          return original(tokens, idx, options, env, self);
        } catch (e) {
          return md.utils.escapeHtml(tokens[idx].content);
        }
      };
    }
  },
};
