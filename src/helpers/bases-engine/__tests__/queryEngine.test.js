import { describe, it, expect } from "vitest";
import { executeBaseQuery } from "../queryEngine.js";

// Test fixture: 6 notes with varied properties
const testNotes = [
	{
		path: "books/The Great Gatsby.md",
		url: "/notes/the-great-gatsby/",
		metadata: {
			tags: ["book", "fiction", "classic"],
			author: "F. Scott Fitzgerald",
			year: 1925,
			rating: 4.5,
			genre: "Fiction",
			wordCount: 47094,
			status: "read",
			favorite: true,
		},
		fileSlug: "the-great-gatsby",
	},
	{
		path: "books/1984.md",
		url: "/notes/1984/",
		metadata: {
			tags: ["book", "fiction", "dystopia"],
			author: "George Orwell",
			year: 1949,
			rating: 4.8,
			genre: "Fiction",
			wordCount: 88942,
			status: "read",
			favorite: true,
		},
		fileSlug: "1984",
	},
	{
		path: "books/Sapiens.md",
		url: "/notes/sapiens/",
		metadata: {
			tags: ["book", "nonfiction"],
			author: "Yuval Noah Harari",
			year: 2011,
			rating: 4.2,
			genre: "Non-Fiction",
			wordCount: 115000,
			status: "read",
			favorite: false,
		},
		fileSlug: "sapiens",
	},
	{
		path: "books/Dune.md",
		url: "/notes/dune/",
		metadata: {
			tags: ["book", "fiction", "scifi"],
			author: "Frank Herbert",
			year: 1965,
			rating: 4.7,
			genre: "Fiction",
			wordCount: 188000,
			status: "reading",
			favorite: true,
		},
		fileSlug: "dune",
	},
	{
		path: "books/Clean Code.md",
		url: "/notes/clean-code/",
		metadata: {
			tags: ["book", "nonfiction", "tech"],
			author: "Robert C. Martin",
			year: 2008,
			rating: 3.9,
			genre: "Non-Fiction",
			wordCount: 62000,
			status: "read",
			favorite: false,
		},
		fileSlug: "clean-code",
	},
	{
		path: "notes/Random Note.md",
		url: "/notes/random-note/",
		metadata: {
			tags: ["note"],
			wordCount: 500,
		},
		fileSlug: "random-note",
	},
];

describe("executeBaseQuery", () => {
	describe("basic query", () => {
		it("returns correct rows for a single table view", () => {
			const yaml = `
views:
  - type: table
    name: "All Notes"
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views).toHaveLength(1);
			expect(result.views[0].config.type).toBe("table");
			expect(result.views[0].config.name).toBe("All Notes");
			expect(result.views[0].rows).toHaveLength(6);
		});

		it("returns properties from parsed query", () => {
			const yaml = `
properties:
  status:
    displayName: "Status"
views:
  - type: table
    name: "Test"
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.properties).toEqual({
				status: { displayName: "Status" },
			});
		});
	});

	describe("filtering", () => {
		it("filters by string expression (year > 1940)", () => {
			const yaml = `
filters:
  - 'year > 1940'
views:
  - type: table
    name: "Modern Books"
`;
			const result = executeBaseQuery(yaml, testNotes);
			// 1949, 2011, 1965, 2008 pass; 1925 fails; random note has no year so undefined > 1940 = false
			expect(result.views[0].rows).toHaveLength(4);
			result.views[0].rows.forEach((row) => {
				expect(row.metadata.year).toBeGreaterThan(1940);
			});
		});

		it("filters by file.hasTag('fiction')", () => {
			const yaml = `
filters:
  - 'file.hasTag("fiction")'
views:
  - type: table
    name: "Fiction"
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].rows).toHaveLength(3);
			result.views[0].rows.forEach((row) => {
				expect(row.metadata.tags).toContain("fiction");
			});
		});

		it("filters with compound AND", () => {
			const yaml = `
filters:
  and:
    - 'file.hasTag("fiction")'
    - 'year > 1940'
views:
  - type: table
    name: "Modern Fiction"
`;
			const result = executeBaseQuery(yaml, testNotes);
			// 1984 (1949) and Dune (1965) pass
			expect(result.views[0].rows).toHaveLength(2);
		});

		it("filters with compound OR", () => {
			const yaml = `
filters:
  or:
    - 'year < 1930'
    - 'year > 2000'
views:
  - type: table
    name: "Old or New"
`;
			const result = executeBaseQuery(yaml, testNotes);
			// Gatsby (1925), Sapiens (2011), Clean Code (2008)
			expect(result.views[0].rows).toHaveLength(3);
		});

		it("filters with NOT", () => {
			const yaml = `
filters:
  not:
    - 'file.hasTag("fiction")'
views:
  - type: table
    name: "Non-Fiction"
`;
			const result = executeBaseQuery(yaml, testNotes);
			// Sapiens, Clean Code, Random Note
			expect(result.views[0].rows).toHaveLength(3);
		});

		it("applies view-specific filters", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "High Rated Books"
    filters:
      - 'rating >= 4.5'
`;
			const result = executeBaseQuery(yaml, testNotes);
			// Global: all books (5). View: rating >= 4.5 -> Gatsby(4.5), 1984(4.8), Dune(4.7)
			expect(result.views[0].rows).toHaveLength(3);
		});
	});

	describe("formulas", () => {
		it("computes formula values and stores in __formulas", () => {
			const yaml = `
formulas:
  readingTime: '(wordCount / 200)'
views:
  - type: table
    name: "With Formulas"
`;
			const result = executeBaseQuery(yaml, testNotes);
			const gatsby = result.views[0].rows.find(
				(r) => r.fileSlug === "the-great-gatsby",
			);
			expect(gatsby.__formulas.readingTime).toBeCloseTo(47094 / 200);
		});
	});

	describe("sorting", () => {
		it("sorts by metadata field ASC", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "By Year"
    sort:
      - property: year
        direction: ASC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const years = result.views[0].rows.map((r) => r.metadata.year);
			expect(years).toEqual([1925, 1949, 1965, 2008, 2011]);
		});

		it("sorts by metadata field DESC", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "By Rating DESC"
    sort:
      - property: rating
        direction: DESC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const ratings = result.views[0].rows.map((r) => r.metadata.rating);
			expect(ratings).toEqual([4.8, 4.7, 4.5, 4.2, 3.9]);
		});

		it("sorts by file.name", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "By Name"
    sort:
      - property: file.name
        direction: ASC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const names = result.views[0].rows.map((r) => {
				const parts = r.path.split("/");
				return parts[parts.length - 1].replace(/\.[^.]+$/, "");
			});
			expect(names).toEqual([
				"1984",
				"Clean Code",
				"Dune",
				"Sapiens",
				"The Great Gatsby",
			]);
		});

		it("sorts by formula value", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
formulas:
  readingTime: '(wordCount / 200)'
views:
  - type: table
    name: "By Reading Time"
    sort:
      - property: formula.readingTime
        direction: ASC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const times = result.views[0].rows.map(
				(r) => r.__formulas.readingTime,
			);
			for (let i = 1; i < times.length; i++) {
				expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
			}
		});

		it("sorts by multiple keys (genre ASC, rating DESC)", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Multi-sort"
    sort:
      - property: genre
        direction: ASC
      - property: rating
        direction: DESC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const rows = result.views[0].rows;
			// Fiction group: 1984(4.8), Dune(4.7), Gatsby(4.5) — then Non-Fiction: Sapiens(4.2), Clean Code(3.9)
			const genreRating = rows.map((r) => ({
				genre: r.metadata.genre,
				rating: r.metadata.rating,
			}));
			// All Fiction rows come before Non-Fiction rows
			const fictionRows = genreRating.filter((r) => r.genre === "Fiction");
			const nonFictionRows = genreRating.filter(
				(r) => r.genre === "Non-Fiction",
			);
			expect(fictionRows.length).toBe(3);
			expect(nonFictionRows.length).toBe(2);
			// Within Fiction, rating is descending
			const fictionRatings = fictionRows.map((r) => r.rating);
			expect(fictionRatings).toEqual([4.8, 4.7, 4.5]);
			// Within Non-Fiction, rating is descending
			const nonFictionRatings = nonFictionRows.map((r) => r.rating);
			expect(nonFictionRatings).toEqual([4.2, 3.9]);
			// Fiction rows come before Non-Fiction in the combined result
			const firstNonFictionIdx = rows.findIndex(
				(r) => r.metadata.genre === "Non-Fiction",
			);
			const lastFictionIdx = rows.reduce(
				(last, r, i) => (r.metadata.genre === "Fiction" ? i : last),
				-1,
			);
			expect(lastFictionIdx).toBeLessThan(firstNonFictionIdx);
		});

		it("sorts using legacy order (first column ASC)", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Legacy Order"
    order: [year, author]
`;
			const result = executeBaseQuery(yaml, testNotes);
			const years = result.views[0].rows.map((r) => r.metadata.year);
			expect(years).toEqual([1925, 1949, 1965, 2008, 2011]);
		});
	});

	describe("groupBy", () => {
		it("groups rows by property value", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "By Genre"
    groupBy:
      property: genre
`;
			const result = executeBaseQuery(yaml, testNotes);
			const view = result.views[0];
			expect(view.groups).not.toBeNull();
			expect(view.groups.length).toBeGreaterThanOrEqual(2);
			const fictionGroup = view.groups.find((g) => g.key === "Fiction");
			expect(fictionGroup.rows).toHaveLength(3);
			const nonFictionGroup = view.groups.find(
				(g) => g.key === "Non-Fiction",
			);
			expect(nonFictionGroup.rows).toHaveLength(2);
		});

		it("sorts groups by direction DESC", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "By Genre DESC"
    groupBy:
      property: genre
      direction: DESC
`;
			const result = executeBaseQuery(yaml, testNotes);
			const keys = result.views[0].groups.map((g) => g.key);
			// DESC alphabetical: Non-Fiction before Fiction
			expect(keys).toEqual(["Non-Fiction", "Fiction"]);
		});
	});

	describe("limit", () => {
		it("truncates rows to limit", () => {
			const yaml = `
views:
  - type: table
    name: "Limited"
    limit: 3
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].rows).toHaveLength(3);
		});

		it("limit applies after grouping (total rows)", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Grouped Limited"
    groupBy:
      property: genre
    limit: 3
`;
			const result = executeBaseQuery(yaml, testNotes);
			const totalRows = result.views[0].groups.reduce(
				(sum, g) => sum + g.rows.length,
				0,
			);
			expect(totalRows).toBe(3);
		});
	});

	describe("summaries", () => {
		it("computes Average summary", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "With Summaries"
    summaries:
      rating: Average
`;
			const result = executeBaseQuery(yaml, testNotes);
			const avg = (4.5 + 4.8 + 4.2 + 4.7 + 3.9) / 5;
			expect(result.views[0].computedSummaries.rating).toBeCloseTo(avg);
		});

		it("computes Sum summary", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Sum"
    summaries:
      wordCount: Sum
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].computedSummaries.wordCount).toBe(
				47094 + 88942 + 115000 + 188000 + 62000,
			);
		});

		it("computes Min and Max summaries", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "MinMax"
    summaries:
      year: Min
      rating: Max
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].computedSummaries.year).toBe(1925);
			expect(result.views[0].computedSummaries.rating).toBe(4.8);
		});

		it("computes Median summary", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Median"
    summaries:
      rating: Median
`;
			const result = executeBaseQuery(yaml, testNotes);
			// Sorted: 3.9, 4.2, 4.5, 4.7, 4.8 -> median = 4.5
			expect(result.views[0].computedSummaries.rating).toBe(4.5);
		});

		it("computes Count summary", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Count"
    summaries:
      author: Count
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].computedSummaries.author).toBe(5);
		});

		it("computes Empty and Filled summaries", () => {
			const yaml = `
views:
  - type: table
    name: "EmptyFilled"
    summaries:
      author: Filled
      genre: Empty
`;
			const result = executeBaseQuery(yaml, testNotes);
			// 5 notes have author, 1 (Random Note) does not
			expect(result.views[0].computedSummaries.author).toBe(5);
			// 1 note has no genre (Random Note)
			expect(result.views[0].computedSummaries.genre).toBe(1);
		});

		it("computes Unique summary", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Unique"
    summaries:
      genre: Unique
`;
			const result = executeBaseQuery(yaml, testNotes);
			// Fiction, Non-Fiction
			expect(result.views[0].computedSummaries.genre).toBe(2);
		});
	});

	describe("wiki-link pipe escaping", () => {
		it("parses YAML containing \\| escape sequences from Obsidian wiki-links", () => {
			const yaml = `
filters:
  - 'file.hasTag("book")'
views:
  - type: table
    name: "Links with aliases"
`;
			// Notes with metadata containing wiki-link aliases (as Obsidian writes them)
			const notesWithLinks = [
				{
					path: "Glossario/HTML.md",
					url: "/notes/html/",
					metadata: {
						tags: ["book"],
						children: '[[Glossario/CSS\\|CSS]]',
					},
					fileSlug: "html",
				},
			];
			const result = executeBaseQuery(yaml, notesWithLinks);
			expect(result.views[0].rows).toHaveLength(1);
		});

		it("handles \\| in filter expressions within double-quoted YAML strings", () => {
			// This simulates a base query that itself contains \| in a double-quoted value
			const yaml = 'views:\n  - type: table\n    name: "Test \\|"\n';
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].config.name).toBe("Test |");
			expect(result.views[0].rows).toHaveLength(6);
		});

		it("handles multiple \\| occurrences in YAML", () => {
			const yaml = `
views:
  - type: table
    name: "[[Page\\|Alias]] and [[Other\\|Link]]"
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].config.name).toBe("[[Page|Alias]] and [[Other|Link]]");
		});
	});

	describe("error handling", () => {
		it("throws on missing views array", () => {
			const yaml = `
properties:
  status:
    displayName: "Status"
`;
			expect(() => executeBaseQuery(yaml, testNotes)).toThrow(/views/i);
		});

		it("throws on malformed YAML", () => {
			const yaml = `
  - ]: invalid
  {{{}}}
`;
			expect(() => executeBaseQuery(yaml, testNotes)).toThrow();
		});
	});

	describe("empty result set", () => {
		it("returns empty rows when no notes match", () => {
			const yaml = `
filters:
  - 'year > 9999'
views:
  - type: table
    name: "Empty"
`;
			const result = executeBaseQuery(yaml, testNotes);
			expect(result.views[0].rows).toHaveLength(0);
			expect(result.views[0].groups).toBeNull();
		});
	});
});
