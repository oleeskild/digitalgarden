const slugify = require("@sindresorhus/slugify");
const markdownIt = require("markdown-it");
const fs = require('fs');
const matter = require('gray-matter');
const faviconPlugin = require('eleventy-favicon');
const tocPlugin = require('eleventy-plugin-toc');

const {headerToId, namedHeadingsFilter} = require("./src/helpers/utils") 

module.exports = function(eleventyConfig) {

    let markdownLib = markdownIt({
            breaks: true,
            html: true
        })
        .use(require("markdown-it-footnote"))
        .use(require("markdown-it-attrs"))
        .use(require("markdown-it-hashtag"),{
            hashtagRegExp: `[^\\s!@#$%^&*()=+.,\[{\\]};:'"?><]+`
        })
        .use(function(md){
            md.renderer.rules.hashtag_open  = function(tokens, idx) {
                return '<a class="tag" onclick="toggleTagSearch(this)">'
            }
        })
        .use(require('markdown-it-mathjax3'), {
            tex: {
                inlineMath: [
                    ["$", "$"]
                ]
            },
            options: {
                skipHtmlTags: { '[-]': ['pre'] }
            }
        })
        .use(require('markdown-it-task-checkbox'), {
            disabled: true,
            divWrap: false,
            divClass: 'checkbox',
            idPrefix: 'cbx_',
            ulClass: 'task-list',
            liClass: 'task-list-item'
        })
        .use(require('markdown-it-plantuml'), {
            openMarker: '```plantuml',
            closeMarker: '```'
        })
        .use(namedHeadingsFilter)
        .use(function(md) {
            //https://github.com/DCsunset/markdown-it-mermaid-plugin
            const origFenceRule = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options, env, self);
            };
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
                    if (code && code.toLowerCase().startsWith("title:")) {
                        const title = code.substring(6, code.indexOf("\n"));
                        const titleDiv = title ? `<div class="admonition-title">${title}</div>` : '';
                        return `<div class="language-${token.info} admonition admonition-example admonition-plugin">${titleDiv}${md.render(code.slice(code.indexOf("\n")))}</div>`;
                    }

                    const title = `<div class="admonition-title">${token.info.charAt(3).toUpperCase()}${token.info.substring(4).toLowerCase()}</div>`;
                    return `<div class="language-${token.info} admonition admonition-example admonition-plugin">${title}${md.render(code)}</div>`;

                }

                // Other languages
                return origFenceRule(tokens, idx, options, env, slf);
            };



            const defaultImageRule = md.renderer.rules.image || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options, env, self);
            };
            md.renderer.rules.image = (tokens, idx, options, env, self) => {
                const imageName = tokens[idx].content;
                const [fileName, width] = imageName.split("|");
                if (width) {
                    const widthIndex = tokens[idx].attrIndex('width');
                    const widthAttr = `${width}px`;
                    if (widthIndex < 0) {
                        tokens[idx].attrPush(['width', widthAttr]);
                    } else {
                        tokens[idx].attrs[widthIndex][1] = widthAttr;
                    }
                }

                return defaultImageRule(tokens, idx, options, env, self);
            };


            const defaultLinkRule = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options, env, self);
            };
            md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
                const aIndex = tokens[idx].attrIndex('target');
                const classIndex = tokens[idx].attrIndex('class');

                if (aIndex < 0) {
                    tokens[idx].attrPush(['target', '_blank']);
                } else {
                    tokens[idx].attrs[aIndex][1] = '_blank';
                }

                if (classIndex < 0) {
                    tokens[idx].attrPush(['class', 'external-link']);
                } else {
                    tokens[idx].attrs[classIndex][1] = 'external-link';
                }

                return defaultLinkRule(tokens, idx, options, env, self);
            };

        });

    eleventyConfig.setLibrary("md", markdownLib);

    eleventyConfig.addFilter('link', function(str) {
        return str && str.replace(/\[\[(.*?\|.*?)\]\]/g, function(match, p1) {
            //Check if it is an embedded excalidraw drawing or mathjax javascript
            if (p1.indexOf("],[") > -1 || p1.indexOf('"$"') > -1) {
                return match;
            }
            const [fileLink, linkTitle] = p1.split("|");

            let fileName = fileLink;
            let header = "";
            let headerLinkPath = "";
            if (fileLink.includes("#")) {
                [fileName, header] = fileLink.split("#");
                headerLinkPath = `#${headerToId(header)}`;
            }

            let permalink = `/notes/${slugify(fileName)}`;
            const title = linkTitle ? linkTitle : fileName;
            let deadLink = false;

            try {
                const startPath = './src/site/notes/';
                const fullPath = fileName.endsWith('.md') ? 
                    `${startPath}${fileName}`
                    :`${startPath}${fileName}.md`;
                const file = fs.readFileSync(fullPath, 'utf8');
                const frontMatter = matter(file);
                if (frontMatter.data.permalink) {
                    permalink = frontMatter.data.permalink;
                }
            } catch {
                deadLink = true;
            }

            return `<a class="internal-link ${deadLink?'is-unresolved':''}" href="${permalink}${headerLinkPath}">${title}</a>`;
        });
    })

    eleventyConfig.addFilter('highlight', function(str) {
        return str && str.replace(/\=\=(.*?)\=\=/g, function(match, p1) {
            return `<mark>${p1}</mark>`;
        });
    });


    eleventyConfig.addTransform('callout-block', function(str) {
        return str && str.replace(/<blockquote>((.|\n)*?)<\/blockquote>/g, function(match, content) {
            let titleDiv = "";
            let calloutType = "";
            const calloutMeta = /\[!(\w*)\](\s?.*)/g;
            if (!content.match(calloutMeta)) {
                return match;
            }

            content = content.replace(calloutMeta, function(metaInfoMatch, callout, title) {
                calloutType = callout;
                titleDiv = title.replace("<br>", "") ?
                    `<div class="admonition-title">${title}</div>` :
                    `<div class="admonition-title">${callout.charAt(0).toUpperCase()}${callout.substring(1).toLowerCase()}</div>`;
                return "";
            });

            return `<div class="callout-${calloutType?.toLowerCase()} admonition admonition-example admonition-plugin">
                ${titleDiv}
                ${content}
            </div>`;
        });
    });

    eleventyConfig.addPassthroughCopy("src/site/img");
    eleventyConfig.addPlugin(faviconPlugin, { destination: 'dist' });
    eleventyConfig.addPlugin(tocPlugin, {ul:true, tags: ['h1','h2', 'h3', 'h4', 'h5', 'h6']});
    eleventyConfig.addFilter('jsonify', function (variable) {
      return JSON.stringify(variable);
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
