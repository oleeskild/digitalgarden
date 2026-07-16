import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { compactNoteMetadata } = require("./linkUtils");

describe("compactNoteMetadata", () => {
  test("keeps base-query metadata without retaining Eleventy data graphs", () => {
    const source = {
      title: "Readable title",
      tags: ["probability", "gardenEntry"],
      permalink: "/notes/example/",
      noteIcon: "sigma",
      hide: false,
      "dg-note-properties": {
        author: "Ada",
        status: "draft",
      },
      collections: { note: [{ data: { title: "recursive" } }] },
      graph: { nodes: { a: {} }, links: [] },
      basesNotes: [{ metadata: { basesNotes: [] } }],
      filetree: { children: [] },
      page: { inputPath: "source.md" },
      pkg: { version: "test" },
    };

    const metadata = compactNoteMetadata(source);

    expect(metadata).toEqual({
      title: "Readable title",
      tags: ["probability", "gardenEntry"],
      permalink: "/notes/example/",
      noteIcon: "sigma",
      hide: false,
      "dg-note-properties": {
        author: "Ada",
        status: "draft",
      },
    });
  });
});