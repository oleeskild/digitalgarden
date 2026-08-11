import { describe, it, expect } from "vitest";
import {
  resolveVaultPath,
  extractLinks,
  convertMdHrefs,
  getGraph,
} from "./linkUtils.js";

describe("resolveVaultPath", () => {
  it("resolves a sibling-relative link with ../", () => {
    expect(resolveVaultPath("../authors/andrade.md", "wiki/concepts")).toBe(
      "wiki/authors/andrade.md",
    );
  });

  it("resolves a link relative to the vault root note", () => {
    expect(resolveVaultPath("wiki/concepts/assessment.md", "")).toBe(
      "wiki/concepts/assessment.md",
    );
  });

  it("treats a leading slash as vault-root", () => {
    expect(resolveVaultPath("/wiki/concepts/assessment.md", "wiki")).toBe(
      "wiki/concepts/assessment.md",
    );
  });

  it("decodes URL-encoded characters", () => {
    expect(resolveVaultPath("My%20Note.md", "")).toBe("My Note.md");
  });

  it("returns null for external links", () => {
    expect(resolveVaultPath("https://example.com/x.md", "wiki")).toBe(null);
    expect(resolveVaultPath("mailto:a@b.com", "wiki")).toBe(null);
  });

  it("returns null for links escaping the vault root", () => {
    expect(resolveVaultPath("../../../etc/passwd.md", "wiki")).toBe(null);
  });
});

describe("extractLinks with markdown-style links", () => {
  it("extracts relative markdown links resolved against the source path", () => {
    const content =
      "See [Andrade](../authors/andrade.md) and [Feedback](../concepts/feedback.md).";
    const links = extractLinks(content, "wiki/concepts/high-impact-practices");
    expect(links).toContain("wiki/authors/andrade");
    expect(links).toContain("wiki/concepts/feedback");
  });

  it("extracts root-note markdown links", () => {
    const links = extractLinks(
      "[Assessment](wiki/concepts/assessment.md)",
      "index",
    );
    expect(links).toContain("wiki/concepts/assessment");
  });

  it("strips fragments from markdown links", () => {
    const links = extractLinks("[X](../concepts/feedback.md#model)", "wiki/a/b");
    expect(links).toContain("wiki/concepts/feedback");
  });

  it("extracts vault-root markdown links from nested notes", () => {
    const links = extractLinks(
      "[Assessment](wiki/concepts/assessment.md)",
      "journal/2026/some-note",
    );
    expect(links).toContain("wiki/concepts/assessment");
  });

  it("ignores image embeds and external markdown links", () => {
    const links = extractLinks(
      "![img](../img/pic.md) [ext](https://example.com/a.md)",
      "wiki/a/b",
    );
    expect(links).not.toContain("wiki/img/pic");
    expect(links.some((l) => l.includes("example.com"))).toBe(false);
  });

  it("still extracts wikilinks without a source path (backwards compat)", () => {
    const links = extractLinks("[[wiki/concepts/feedback|Feedback]]");
    expect(links).toContain("wiki/concepts/feedback");
  });
});

describe("convertMdHrefs", () => {
  const knownPaths = {
    "wiki/concepts/feedback.md": { href: "/wiki/concepts/feedback/" },
    "wiki/authors/andrade.md": { href: "/wiki/authors/andrade/" },
  };
  const resolver = (candidates) => {
    for (const vaultPath of candidates) {
      if (knownPaths[vaultPath]) return knownPaths[vaultPath];
    }
    return null;
  };

  it("rewrites a relative .md href to the resolved permalink", () => {
    const html =
      '<p><a href="../concepts/feedback.md" class="internal-link">Feedback</a></p>';
    const out = convertMdHrefs(html, "wiki/concepts", resolver);
    expect(out).toContain('href="/wiki/concepts/feedback/"');
    expect(out).not.toContain(".md");
    expect(out).toContain(">Feedback</a>");
  });

  it("preserves fragments on rewritten hrefs", () => {
    const html = '<a class="internal-link" href="../authors/andrade.md#bio">A</a>';
    const out = convertMdHrefs(html, "wiki/concepts", resolver);
    expect(out).toContain('href="/wiki/authors/andrade/#bio"');
  });

  it("leaves external, absolute and non-md hrefs untouched", () => {
    const html =
      '<a href="https://example.com/a.md">x</a>' +
      '<a href="/already/resolved/">y</a>' +
      '<a href="../img/photo.png">z</a>';
    expect(convertMdHrefs(html, "wiki/concepts", resolver)).toBe(html);
  });

  it("leaves unresolvable .md hrefs to the resolver's discretion", () => {
    const html = '<a href="../concepts/missing.md" class="internal-link">m</a>';
    const out = convertMdHrefs(html, "wiki/concepts", () => null);
    expect(out).toBe(html);
  });

  it("does not rewrite data-href attributes on dataviewjs anchors", () => {
    // DataviewJS output contains Obsidian-rendered anchors where data-href
    // (and href) hold a vault-root path. data-href must survive untouched:
    // the dataview-js-links transform resolves the anchor from it.
    const html =
      '<a data-href="wiki/concepts/feedback.md" href="wiki/concepts/feedback.md" class="internal-link" target="_blank" rel="noopener nofollow">Feedback</a>';
    const out = convertMdHrefs(html, "wiki/concepts", resolver);
    expect(out).toContain('data-href="wiki/concepts/feedback.md"');
    expect(out).toContain('href="/wiki/concepts/feedback/"');
  });

  it("falls back to vault-root resolution for non-relative targets", () => {
    // A note nested in wiki/concepts linking to a vault-root path, as
    // dataview and Obsidian's "absolute path in vault" setting produce.
    const html =
      '<a href="wiki/authors/andrade.md" class="internal-link">A</a>';
    const out = convertMdHrefs(html, "wiki/concepts", resolver);
    expect(out).toContain('href="/wiki/authors/andrade/"');
  });

  it("prefers the note-relative interpretation when both resolve", () => {
    const html = '<a href="feedback.md" class="internal-link">F</a>';
    const seen = [];
    convertMdHrefs(html, "wiki/concepts", (candidates) => {
      seen.push(candidates);
      return null;
    });
    expect(seen).toEqual([["wiki/concepts/feedback.md", "feedback.md"]]);
  });
});

describe("getGraph with markdown-style links", () => {
  function makeNote(slug, content, data = {}) {
    return {
      filePathStem: `/notes/${slug}`,
      url: `/${slug}/`,
      fileSlug: slug.split("/").pop(),
      data: { title: slug, ...data },
      template: { read: async () => ({ content }) },
    };
  }

  it("creates graph edges from relative markdown links", async () => {
    const a = makeNote(
      "wiki/concepts/high-impact-practices",
      "[Andrade](../authors/andrade.md)",
    );
    const b = makeNote("wiki/authors/andrade", "nothing here");
    const graph = await getGraph({ collections: { note: [a, b] } });
    expect(graph.links.length).toBe(1);
    expect(
      graph.nodes["/wiki/concepts/high-impact-practices/"].outBound,
    ).toContain("/wiki/authors/andrade/");
    expect(graph.nodes["/wiki/authors/andrade/"].backLinks).toContain(
      "/wiki/concepts/high-impact-practices/",
    );
  });
});
