const { extractLinks } = require("../helpers/linkUtils");

module.exports = {
  eleventyComputed: {
    graphData: (data) => {
      let nodes = {};
      let links = [];
      let stemURLs = {};
      data.collections.note.forEach((v, idx) => {
        let fpath = v.filePathStem.replace("/notes/", "");
        let parts = fpath.split("/");
        let group = "none";
        if (parts.length >= 3) {
          group = parts[parts.length - 2];
        }
        nodes[v.url] = {
          id: idx,
          title: v.data.title || v.fileSlug,
          url: v.url,
          group,
          home: v.data["dg-home"] || false,
          outBound: extractLinks(v.template.frontMatter.content),
          neighbors: new Set(),
        };
        stemURLs[fpath] = v.url;
      });
      Object.values(nodes).forEach((node) => {
        let outBound = new Set();
        node.outBound.forEach((olink) => {
          let link = (stemURLs[olink] || olink).split("#")[0];
          outBound.add(link);
        });
        node.outBound = Array.from(outBound);
        node.outBound.forEach((link) => {
          let n = nodes[link];
          if (n) {
            n.neighbors.add(node.url);
            node.neighbors.add(n.url);
            links.push({ source: node.id, target: n.id });
          }
        });
      });
      Object.keys(nodes).map((k) => {
        nodes[k].neighbors = Array.from(nodes[k].neighbors);
        nodes[k].size = nodes[k].neighbors.length;
      });
      return JSON.stringify({
        nodes,
        links,
      });
    },
  },
};
