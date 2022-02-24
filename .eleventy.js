
module.exports = function (eleventyConfig) {

    let markdownIt = require("markdown-it");
    let markdownLib = markdownIt({
        breaks: true,
        html: true
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

            if (aIndex < 0) {
                tokens[idx].attrPush(['target', '_blank']);
            } else {
                tokens[idx].attrs[aIndex][1] = '_blank';
            }

            tokens[idx].attrPush(['class', '_blank']);

            return defaultRender(tokens, idx, options, env, self);
        };
    });

    eleventyConfig.setLibrary("md", markdownLib);


    eleventyConfig.addFilter('link', function (str) {
        return str && str.replace(/\[\[(.*?)\]\]/g, '<a class="internal-link" href="/notes/$1">$1</a>');
    })

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