const eleventyPluginSyntaxHighlighter = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function(eleventyConfig) {

    let markdownIt = require("markdown-it");
    let markdownLib = markdownIt({
        html: true,
    }).use(function(md) {
        //https://github.com/DCsunset/markdown-it-mermaid-plugin
        const origRule = md.renderer.rules.fence.bind(md.renderer.rules);
        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
            const token = tokens[idx];
            if (token.info === 'mermaid') {
                const code = token.content.trim();
                return `<pre class="mermaid">${code}</pre>`;
            }

            // Other languages
            return origRule(tokens, idx, options, env, slf);
        };
    });

    eleventyConfig.setLibrary("md", markdownLib);


    eleventyConfig.addFilter('link', function(str) {
        return str && str.replace(/\[\[(.*?)\]\]/g, '<a href="/notes/$1">$1</a>');
    })

    eleventyConfig.addPlugin(eleventyPluginSyntaxHighlighter, {
        init: function({ Prism }) {
            Prism.languages['ad-note'] = Prism.languages.extend("markup", {});
            Prism.languages['ad-tip'] = Prism.languages.extend("markup", {});
            Prism.languages['ad-warning'] = Prism.languages.extend("markup", {});
            Prism.languages['ad-caution'] = Prism.languages.extend("markup", {});
            Prism.languages['ad-important'] = Prism.languages.extend("markup", {});
            Prism.languages['ad-info'] = Prism.languages.extend("markup", {});
            Prism.languages['transclusion'] = Prism.languages.extend("markup", {});
        }
    });


    return {
        dir: {
            input: "src/site",
            output: "dist",
            data: `_data`
        },
        templateFormats: ["njk", "md", "11ty.js", "css"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
        passthroughFileCopy: true,
    };

};