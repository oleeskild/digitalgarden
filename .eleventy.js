const eleventyPluginSyntaxHighlighter = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {

    let markdownIt = require("markdown-it");
    let markdownLib = markdownIt({
        html: true,
    }).use(function (md) {
        //https://github.com/DCsunset/markdown-it-mermaid-plugin
        const origRule = md.renderer.rules.fence.bind(md.renderer.rules);
        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
            const token = tokens[idx];
            if (token.info === 'mermaid') {
                const code = token.content.trim();
                return `<pre class="mermaid">${code}</pre>`;
            }
            if (token.info === 'transclusion') {
                const code = token.content.trim();
                return `<div class="transclusion">${md.render(code)}</div>`;
            }
            if (token.info.startsWith("ad-")) {
                const code = token.content.trim();
                return `<pre class="language-${token.info}">${md.render(code)}</pre>`;
            }

            // Other languages
            return origRule(tokens, idx, options, env, slf);
        };

        const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
            const aIndex = tokens[idx].attrIndex('target');
            const classIndex = tokens[idx].attrIndex('class');

            if (aIndex < 0) {
                tokens[idx].attrPush(['target', '_blank']); 
            } else {
                tokens[idx].attrs[aIndex][1] = '_blank';
            }

            if (classIndex< 0) {
                tokens[idx].attrPush(['class', 'external-link']); 
            } else {
                tokens[idx].attrs[classIndex][1] = 'external-link';
            }

            return defaultRender(tokens, idx, options, env, self);
        };
    });

    eleventyConfig.setLibrary("md", markdownLib);


    eleventyConfig.addFilter('link', function (str) {
        return str && str.replace(/\[\[(.*?)\]\]/g, '<a class="internal-link" href="/notes/$1">$1</a>');
    })

    eleventyConfig.addPlugin(eleventyPluginSyntaxHighlighter, {
        init: function ({ Prism }) {
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