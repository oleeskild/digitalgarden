import { describe, expect, it } from "vitest";
import { minifyProductionHtml } from "../minify-html.js";

describe("production HTML minification", () => {
  it("preserves MathJax SVG colors", async () => {
    const mathJax = `
      <span id="mjx-test">
        <style>
          #mjx-test {
            display: contents;
            mjx-assistive-mml {
              user-select: text !important;
              clip: auto !important;
              color: rgba(0, 0, 0, 0);
            }
          }
        </style>
        <mjx-container jax="SVG">
          <svg><path fill="currentColor" /></svg>
        </mjx-container>
      </span>
    `;

    const output = await minifyProductionHtml(mathJax);

    expect(output).toContain('fill="currentColor"');
    expect(output).toContain("color: rgba(0, 0, 0, 0)");
    expect(output).not.toMatch(/#mjx-test[^}]*color:\s*transparent/);
  });
});
