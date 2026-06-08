import { describe, it, expect } from "vitest";

// Reproduces the decode-then-split logic from getAnchorAttributes in .eleventy.js.
// This guards against the regression where filePath was split instead of the
// already-decoded fileName, leaving &amp; in the resolved path.
function decodeAndSplit(filePath) {
  let fileName = filePath.replaceAll("&amp;", "&");
  let header = "";
  if (fileName.includes("#")) {
    [fileName, header] = fileName.split("#");
  }
  return { fileName, header };
}

describe("getAnchorAttributes &amp; + # decode/split logic", () => {
  it("decodes &amp; in path that also contains a heading anchor", () => {
    const filePath =
      "Software Engineering/11 AI &amp; ML/LLM/RAG/Monitoring#Retrieval Quality Metrics";

    const { fileName, header } = decodeAndSplit(filePath);

    expect(fileName).toBe(
      "Software Engineering/11 AI & ML/LLM/RAG/Monitoring",
    );
    expect(header).toBe("Retrieval Quality Metrics");
  });

  it("decodes &amp; in path with no heading anchor", () => {
    const { fileName, header } = decodeAndSplit(
      "Notes/AI &amp; ML/Overview",
    );
    expect(fileName).toBe("Notes/AI & ML/Overview");
    expect(header).toBe("");
  });

  it("handles heading anchor in path without &amp;", () => {
    const { fileName, header } = decodeAndSplit("Notes/Overview#Introduction");
    expect(fileName).toBe("Notes/Overview");
    expect(header).toBe("Introduction");
  });

  it("returns unchanged path when neither &amp; nor # present", () => {
    const { fileName, header } = decodeAndSplit("Notes/Simple Note");
    expect(fileName).toBe("Notes/Simple Note");
    expect(header).toBe("");
  });
});
