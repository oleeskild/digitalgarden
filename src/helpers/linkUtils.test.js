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

describe("linkUtils graph-color", () => {
  it.each([
    ["#ff6b6b", 0xff6b6b],
    [" #AbC ", 0xaabbcc],
    ["#000000", 0],
  ])("exports HEX color %s from published properties", async (value, expected) => {
    const graph = await buildGraph([
      makeNote("colored", { "dg-note-properties": { "graph-color": value } }),
    ]);
    expect(graph.nodes["/colored/"].color).toBe(expected);
  });

  it("reads passed-through frontmatter", async () => {
    const graph = await buildGraph([makeNote("colored", { "graph-color": "#123456" })]);
    expect(graph.nodes["/colored/"].color).toBe(0x123456);
  });

  it.each([undefined, null, "", "red", "#12345", "#gggggg", 123, ["#fff"]])(
    "uses the theme for missing or invalid color %j", async (value) => {
      const graph = await buildGraph([
        makeNote("normal", { "dg-note-properties": { "graph-color": value } }),
      ]);
      expect(graph.nodes["/normal/"].color).toBeUndefined();
      expect(JSON.parse(JSON.stringify(graph)).nodes["/normal/"]).not.toHaveProperty("color");
    },
  );
});

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

describe("linkUtils bases link data", () => {
  it("exposes outbound links as vault paths so link() filters can match them", async () => {
    const todo = makeNote("collections/links/todo", { permalink: "/todo-list/" });
    todo.url = "/todo-list/";
    const log = makeNote("logs/entry");
    log.template = {
      read: async () => ({ content: "Still [[collections/links/todo\\|todo]] here" }),
    };
    const linkUtils = await import("./linkUtils.js");
    await buildGraph([todo, log]);
    const entry = linkUtils._basesNotesWithLinks.find((n) => n.path === "logs/entry");
    expect(entry._links).toEqual(["/todo-list/"]);
    expect(entry._linkPaths).toEqual(["collections/links/todo"]);
    const target = linkUtils._basesNotesWithLinks.find((n) => n.path === "collections/links/todo");
    expect(target._backlinkPaths).toEqual(["logs/entry"]);
  });
});
