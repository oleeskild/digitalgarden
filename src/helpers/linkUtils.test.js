import { describe, it, expect } from "vitest";
import { getGraph } from "./linkUtils.js";

// Minimal note stub matching what getGraph reads.
function makeNote(slug, data = {}) {
  return {
    filePathStem: `/notes/${slug}`,
    url: `/${slug}/`,
    fileSlug: slug,
    data: { title: slug, ...data },
    template: { read: async () => ({ content: "" }) },
  };
}

async function buildGraph(notes) {
  return getGraph({ collections: { note: notes } });
}

describe("linkUtils getGraph hide flags", () => {
  it("does not hide or privatize a normal note", async () => {
    const graph = await buildGraph([makeNote("normal")]);
    expect(graph.nodes["/normal/"].hide).toBe(false);
    expect(graph.nodes["/normal/"].private).toBe(false);
  });

  it("hides and privatizes a note with hide:true (dg-hide)", async () => {
    const graph = await buildGraph([makeNote("secret", { hide: true })]);
    expect(graph.nodes["/secret/"].hide).toBe(true);
    expect(graph.nodes["/secret/"].private).toBe(true);
  });

  it("hides but does not privatize a note with hideInGraph:true", async () => {
    const graph = await buildGraph([
      makeNote("graphonly", { hideInGraph: true }),
    ]);
    expect(graph.nodes["/graphonly/"].hide).toBe(true);
    expect(graph.nodes["/graphonly/"].private).toBe(false);
  });

  it("does not hide a filetree-only note from the graph", async () => {
    const graph = await buildGraph([
      makeNote("treeonly", { hideInFiletree: true }),
    ]);
    expect(graph.nodes["/treeonly/"].hide).toBe(false);
    expect(graph.nodes["/treeonly/"].private).toBe(false);
  });
});
