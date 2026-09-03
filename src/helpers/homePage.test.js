import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hasHomePageNote, frontmatterIsHomePage } from "./homePage.js";

describe("frontmatterIsHomePage", () => {
  it("detects the gardenEntry tag in an array", () => {
    expect(frontmatterIsHomePage({ tags: ["note", "gardenEntry"] })).toBe(true);
  });

  it("detects the gardenEntry tag in a comma separated string", () => {
    expect(frontmatterIsHomePage({ tags: "note, gardenEntry" })).toBe(true);
  });

  it("ignores notes without the tag", () => {
    expect(frontmatterIsHomePage({ tags: ["note"] })).toBe(false);
    expect(frontmatterIsHomePage({})).toBe(false);
    expect(frontmatterIsHomePage(undefined)).toBe(false);
  });
});

describe("hasHomePageNote", () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dg-home-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const write = (rel, content) => {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };

  it("is false for a missing or empty notes directory", () => {
    expect(hasHomePageNote(path.join(dir, "nope"))).toBe(false);
    expect(hasHomePageNote(dir)).toBe(false);
  });

  it("is false when no note is tagged", () => {
    write("a.md", "---\ndg-publish: true\ntags:\n  - note\n---\nhello");
    write("deep/b.md", "---\ndg-publish: true\n---\nhello gardenEntry in body only");
    expect(hasHomePageNote(dir)).toBe(false);
  });

  it("finds a tagged note in a nested folder", () => {
    write("a.md", "---\ndg-publish: true\n---\nhello");
    write("folder/home.md", "---\ndg-publish: true\ntags:\n  - gardenEntry\n---\nwelcome");
    expect(hasHomePageNote(dir)).toBe(true);
  });

  it("tolerates Obsidian's escaped pipe in frontmatter", () => {
    write(
      "home.md",
      "---\nlinks: \"[[Other\\|Alias]]\"\ntags: [gardenEntry]\n---\nwelcome"
    );
    expect(hasHomePageNote(dir)).toBe(true);
  });

  it("treats unparseable frontmatter that mentions the tag as a home page", () => {
    write("home.md", "---\ntags: [gardenEntry\nbroken: : :\n---\nwelcome");
    expect(hasHomePageNote(dir)).toBe(true);
  });
});
