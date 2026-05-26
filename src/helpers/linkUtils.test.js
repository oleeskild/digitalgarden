import { describe, it, expect } from "vitest";

const { extractLinks } = require("./linkUtils");

describe("extractLinks", () => {
  it("ignores internal links inside fenced code blocks and HTML comments", () => {
    const content = `
Actual page link: <a href="/coffees">Coffees</a>
[[Public Wiki|Public]]

\`\`\`html
<div class="dropdown-menu">
  <!--<li><a href="/">Home</a></li>-->
  <li><a href="/code-only">Code only</a></li>
</div>
\`\`\`

<!-- <a href="/comment-only">Comment only</a> -->
[[Wiki Note]]
`;

    expect(extractLinks(content)).toEqual(["Public Wiki", "/coffees"]);
  });

  it("ignores wikilinks and canvas iframes inside fenced code blocks", () => {
    const content = `
<iframe src="/canvas-note/" class="canvas-file-iframe"></iframe>

\`\`\`md
[[Hidden Wiki|Hidden]]
<iframe src="/hidden-canvas/" class="canvas-file-iframe"></iframe>
\`\`\`
`;

    expect(extractLinks(content)).toEqual(["/canvas-note/"]);
  });
});
