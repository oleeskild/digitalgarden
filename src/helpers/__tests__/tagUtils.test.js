import { describe, expect, it } from "vitest";
import { taggify, extractSearchableTags, withoutProtectedBlocks } from "../tagUtils.js";

describe("taggify", () => {
  it("preserves MathJax styles while linking page tags", () => {
    const content =
      '<style>mjx-tip { border: 1px solid #888; }</style><p>#statistics</p>';

    expect(taggify(content)).toBe(
      '<style>mjx-tip { border: 1px solid #888; }</style><p><a class="tag" href="javascript:void(0);" onclick="toggleTagSearch(this)">#statistics</a></p>',
    );
  });
});

describe("extractSearchableTags", () => {
  it("ignores hex colors inside style blocks and keeps page tags", () => {
    const content =
      '<style>mjx-tip { border: 1px solid #888; background-color: #F8F8F8; }</style><p>#calculus #series</p>';

    expect(extractSearchableTags(content)).toEqual(["calculus", "series"]);
  });

  it("dedupes repeated tags", () => {
    expect(extractSearchableTags("<p>#math #math</p>")).toEqual(["math"]);
  });
});

describe("withoutProtectedBlocks", () => {
  it("removes MathJax style CSS so it cannot leak into search snippets", () => {
    const content =
      'Integral Test <style>#mjx-61a4a83{ display:contents; }</style> Summary #calculus';
    const stripped = withoutProtectedBlocks(content)
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    expect(stripped).toBe("Integral Test Summary #calculus");
    expect(stripped).not.toContain("mjx");
  });
});
