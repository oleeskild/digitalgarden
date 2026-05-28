const { getFileTree } = require("./filetreeUtils");

// Helper to build a minimal note object for testing
function makeNote(filePathStem, data = {}) {
  return {
    filePathStem: `/notes${filePathStem}`,
    data: {
      permalink: filePathStem,
      ...data,
    },
  };
}

describe("filetreeUtils", () => {
  describe("getFileTree without navigation ordering", () => {
    it("sorts folders before files, then alphabetically", () => {
      const data = {
        collections: {
          note: [
            makeNote("/zebra"),
            makeNote("/alpha/note1"),
            makeNote("/beta"),
          ],
        },
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      // "alpha" folder should come before files
      expect(keys[0]).toBe("alpha");
      // Then files alphabetically
      expect(keys[1]).toBe("beta.md");
      expect(keys[2]).toBe("zebra.md");
    });
  });

  describe("getFileTree with navigation ordering", () => {
    it("respects ordering from navigationOrder for known items", () => {
      const data = {
        collections: {
          note: [
            makeNote("/alpha"),
            makeNote("/beta"),
            makeNote("/gamma"),
          ],
        },
        navigationOrder: {
          "/": ["gamma.md", "alpha.md", "beta.md"],
        },
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      expect(keys[0]).toBe("gamma.md");
      expect(keys[1]).toBe("alpha.md");
      expect(keys[2]).toBe("beta.md");
    });

    it("appends unknown items after ordered items using default sort", () => {
      const data = {
        collections: {
          note: [
            makeNote("/alpha"),
            makeNote("/beta"),
            makeNote("/gamma"),
            makeNote("/folder1/child"),
          ],
        },
        navigationOrder: {
          "/": ["gamma.md", "alpha.md"],
        },
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      // Ordered items first
      expect(keys[0]).toBe("gamma.md");
      expect(keys[1]).toBe("alpha.md");
      // Then unordered: folders before files, then alphabetical
      expect(keys[2]).toBe("folder1");
      expect(keys[3]).toBe("beta.md");
    });

    it("skips items in ordering that do not exist in tree", () => {
      const data = {
        collections: {
          note: [
            makeNote("/alpha"),
            makeNote("/beta"),
          ],
        },
        navigationOrder: {
          "/": ["deleted-note.md", "alpha.md", "beta.md"],
        },
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      expect(keys).toEqual(["alpha.md", "beta.md"]);
    });

    it("applies ordering to nested folders", () => {
      const data = {
        collections: {
          note: [
            makeNote("/myfolder/zebra"),
            makeNote("/myfolder/alpha"),
            makeNote("/myfolder/middle"),
          ],
        },
        navigationOrder: {
          "/myfolder": ["middle.md", "zebra.md", "alpha.md"],
        },
      };

      const tree = getFileTree(data);
      const folderKeys = Object.keys(tree["myfolder"]).filter(
        (k) => k !== "isFolder"
      );

      expect(folderKeys[0]).toBe("middle.md");
      expect(folderKeys[1]).toBe("zebra.md");
      expect(folderKeys[2]).toBe("alpha.md");
    });

    it("resolves ordering names without .md extension", () => {
      const data = {
        collections: {
          note: [
            makeNote("/alpha"),
            makeNote("/beta"),
            makeNote("/gamma"),
          ],
        },
        navigationOrder: {
          "/": ["gamma", "alpha", "beta"],
        },
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      expect(keys[0]).toBe("gamma.md");
      expect(keys[1]).toBe("alpha.md");
      expect(keys[2]).toBe("beta.md");
    });

    it("falls back to default sort when navigationOrder is empty object", () => {
      const data = {
        collections: {
          note: [
            makeNote("/zebra"),
            makeNote("/alpha"),
          ],
        },
        navigationOrder: {},
      };

      const tree = getFileTree(data);
      const keys = Object.keys(tree);

      expect(keys[0]).toBe("alpha.md");
      expect(keys[1]).toBe("zebra.md");
    });
  });
});
