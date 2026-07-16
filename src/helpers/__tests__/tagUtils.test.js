import { describe, expect, it } from "vitest";
import { taggify } from "../tagUtils.js";

describe("taggify", () => {
  it("preserves MathJax styles while linking page tags", () => {
    const content =
      '<style>mjx-tip { border: 1px solid #888; }</style><p>#statistics</p>';

    expect(taggify(content)).toBe(
      '<style>mjx-tip { border: 1px solid #888; }</style><p><a class="tag" href="javascript:void(0);" onclick="toggleTagSearch(this)">#statistics</a></p>',
    );
  });
});
