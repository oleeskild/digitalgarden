import { describe, it, expect } from "vitest";
import matter from "gray-matter";

// Resolve js-yaml the same way .eleventy.js does
const jsYaml = require(
	require.resolve("js-yaml", { paths: [require.resolve("gray-matter")] }),
);

// Custom YAML engine matching the one configured in .eleventy.js
const yamlEngine = {
	parse: (str) => jsYaml.load(str.replace(/\\\|/g, "|")),
	stringify: (obj) => jsYaml.dump(obj),
};

const parseWithFix = (content) =>
	matter(content, { engines: { yaml: yamlEngine } });

describe("YAML \\| escape sequence fix", () => {
	it("parses frontmatter with wiki-link alias \\|", () => {
		const content = `---
title: "Test"
children: ["[[Glossario/HTML\\|HTML]]","[[Glossario/CSS\\|CSS]]"]
---
Body text`;

		const result = parseWithFix(content);
		expect(result.data.title).toBe("Test");
		expect(result.data.children).toEqual([
			"[[Glossario/HTML|HTML]]",
			"[[Glossario/CSS|CSS]]",
		]);
		expect(result.content.trim()).toBe("Body text");
	});

	it("parses frontmatter without \\| unchanged", () => {
		const content = `---
title: "Normal note"
tags:
  - test
  - example
---
Content here`;

		const result = parseWithFix(content);
		expect(result.data.title).toBe("Normal note");
		expect(result.data.tags).toEqual(["test", "example"]);
	});

	it("handles multiple \\| in a single field value", () => {
		const content = `---
links: "[[A\\|B]] and [[C\\|D]] and [[E\\|F]]"
---
`;

		const result = parseWithFix(content);
		expect(result.data.links).toBe("[[A|B]] and [[C|D]] and [[E|F]]");
	});

	it("handles \\| in nested YAML structures", () => {
		const content = `---
dg-note-properties:
  related: "[[Glossario/HTML\\|HTML]]"
  aliases:
    - "[[Other\\|Alias]]"
---
`;

		const result = parseWithFix(content);
		expect(result.data["dg-note-properties"].related).toBe(
			"[[Glossario/HTML|HTML]]",
		);
		expect(result.data["dg-note-properties"].aliases).toEqual([
			"[[Other|Alias]]",
		]);
	});

	it("preserves valid backslash escapes", () => {
		const content = `---
title: "Line1\\nLine2"
path: "C:\\\\Users\\\\test"
---
`;

		const result = parseWithFix(content);
		expect(result.data.title).toBe("Line1\nLine2");
		expect(result.data.path).toBe("C:\\Users\\test");
	});

	it("throws on truly invalid YAML (not just \\|)", () => {
		const content = `---
  - ]: bad
  {{{}}}
---
`;

		expect(() => parseWithFix(content)).toThrow();
	});

	it("without the fix, \\| causes YAMLException", () => {
		const content = `---
children: ["[[Glossario/HTML\\|HTML]]"]
---
`;

		expect(() => matter(content)).toThrow(/escape/i);
	});
});
