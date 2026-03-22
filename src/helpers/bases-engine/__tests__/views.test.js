import { describe, it, expect } from "vitest";
import { renderViews } from "../views.js";

// Mock query result helpers
function makeRow(name, url, metadata = {}, formulas = {}) {
	return {
		path: `books/${name}.md`,
		url,
		metadata,
		__formulas: formulas,
	};
}

const basicRows = [
	makeRow("The Great Gatsby", "/notes/gatsby/", {
		author: "F. Scott Fitzgerald",
		year: 1925,
		rating: 4.5,
		genre: "Fiction",
		favorite: true,
	}),
	makeRow("1984", "/notes/1984/", {
		author: "George Orwell",
		year: 1949,
		rating: 4.8,
		genre: "Fiction",
		favorite: false,
	}),
	makeRow("Sapiens", "/notes/sapiens/", {
		author: "Yuval Noah Harari",
		year: 2011,
		rating: 4.2,
		genre: "Non-Fiction",
		favorite: true,
	}),
];

function makeQueryResult(views, properties = {}) {
	return { properties, views };
}

function singleView(config, rows, groups = null, computedSummaries = {}) {
	return { config, rows, groups, computedSummaries };
}

describe("renderViews", () => {
	describe("table view", () => {
		it("renders correct HTML structure (table, thead, tbody)", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "My Table",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("<table");
			expect(result).toContain("<thead>");
			expect(result).toContain("<tbody>");
			expect(result).toContain("</table>");
			expect(result).toContain("obsidian-base-table-wrapper");
		});

		it("renders column headers from order", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "My Table",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("<th>Name</th>");
			expect(result).toContain("<th>Author</th>");
			expect(result).toContain("<th>Year</th>");
		});

		it("renders summary bar when computedSummaries has values", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "With Summaries",
							order: ["file.name", "author", "rating"],
							summaries: { rating: "Average" },
						},
						basicRows,
						null,
						{ rating: 4.5 },
					),
				]),
			);
			expect(result).toContain("obsidian-base-summary-bar");
			expect(result).toContain("4.5");
			expect(result).toContain("Average");
		});

		it("does not render summary bar when no summaries", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "No Summaries",
							order: ["file.name", "author"],
						},
						basicRows,
					),
				]),
			);
			expect(result).not.toContain("obsidian-base-summary-bar");
		});
	});

	describe("file.name renders as internal link", () => {
		it("renders file.name as anchor with internal-link class", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Links",
							order: ["file.name", "author"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain(
				'<a href="/notes/gatsby/" class="internal-link">The Great Gatsby</a>',
			);
			expect(result).toContain(
				'<a href="/notes/1984/" class="internal-link">1984</a>',
			);
		});
	});

	describe("boolean values render as checkboxes", () => {
		it("renders true as checked disabled checkbox", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Booleans",
							order: ["file.name", "favorite"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain(
				'<input type="checkbox" checked disabled />',
			);
			expect(result).toContain(
				'<input type="checkbox" disabled />',
			);
		});
	});

	describe("array values", () => {
		it("renders arrays joined with comma-space", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					tags: ["fiction", "classic"],
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Arrays",
							order: ["file.name", "tags"],
						},
						rows,
					),
				]),
			);
			expect(result).toContain("fiction, classic");
		});
	});

	describe("null/undefined values", () => {
		it("renders null/undefined as empty string", () => {
			const rows = [
				makeRow("Test", "/notes/test/", { author: null }),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Nulls",
							order: ["file.name", "author", "nonexistent"],
						},
						rows,
					),
				]),
			);
			// Should have empty <td></td> cells
			expect(result).toMatch(/<td><\/td>/);
		});
	});

	describe("HTML escaping", () => {
		it("escapes HTML in values to prevent XSS", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					author: '<script>alert("xss")</script>',
					title: "Tom & Jerry <3",
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Escape Test",
							order: ["file.name", "author", "title"],
						},
						rows,
					),
				]),
			);
			expect(result).not.toContain("<script>");
			expect(result).toContain("&lt;script&gt;");
			expect(result).toContain("Tom &amp; Jerry &lt;3");
		});

		it("escapes HTML in file names", () => {
			const rows = [
				makeRow('<img src=x onerror=alert(1)>', "/notes/test/", {}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Name Escape",
							order: ["file.name"],
						},
						rows,
					),
				]),
			);
			expect(result).not.toContain("<img");
			expect(result).toContain("&lt;img");
		});
	});

	describe("column auto-detection", () => {
		it("auto-detects columns from row data when no order specified", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					author: "Author1",
					year: 2020,
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView({ type: "table", name: "Auto" }, rows),
				]),
			);
			expect(result).toContain("<th>Name</th>");
			expect(result).toContain("<th>Author</th>");
			expect(result).toContain("<th>Year</th>");
		});

		it("skips internal keys (tags, dg-*, __formulas) in auto-detection", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					tags: ["a"],
					"dg-publish": true,
					author: "Someone",
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView({ type: "table", name: "Skip Internal" }, rows),
				]),
			);
			expect(result).not.toContain("<th>Tags</th>");
			expect(result).not.toContain("dg-publish");
			expect(result).toContain("<th>Author</th>");
		});
	});

	describe("display names from properties config", () => {
		it("uses displayName from properties when available", () => {
			const result = renderViews(
				makeQueryResult(
					[
						singleView(
							{
								type: "table",
								name: "DisplayNames",
								order: ["file.name", "author", "year"],
							},
							basicRows,
						),
					],
					{
						author: { displayName: "Written By" },
						year: { displayName: "Publication Year" },
					},
				),
			);
			expect(result).toContain("<th>Written By</th>");
			expect(result).toContain("<th>Publication Year</th>");
		});
	});

	describe("cards view", () => {
		it("renders grid with correct style", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("obsidian-base-cards");
			expect(result).toContain("grid-template-columns");
			expect(result).toContain("minmax(200px");
			expect(result).toContain("obsidian-base-card");
		});

		it("renders card titles as internal links", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							order: ["file.name", "author"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain(
				'<a href="/notes/gatsby/" class="internal-link">The Great Gatsby</a>',
			);
		});

		it("renders with custom card size", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							cardSize: 300,
							order: ["file.name"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("minmax(300px");
		});

		it("renders property label-value pairs", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("F. Scott Fitzgerald");
			expect(result).toContain("1925");
		});

		it("renders image when config.image is set", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					cover: "/images/cover.jpg",
					author: "Someone",
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							image: "cover",
							order: ["file.name", "author"],
						},
						rows,
					),
				]),
			);
			expect(result).toContain("<img");
			expect(result).toContain("/images/cover.jpg");
			expect(result).toContain("object-fit: cover");
		});

		it("applies custom imageFit and imageAspectRatio", () => {
			const rows = [
				makeRow("Test", "/notes/test/", {
					cover: "/images/cover.jpg",
				}),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Cards",
							image: "cover",
							imageFit: "contain",
							imageAspectRatio: 2,
							order: ["file.name"],
						},
						rows,
					),
				]),
			);
			expect(result).toContain("object-fit: contain");
			expect(result).toContain("aspect-ratio: 2");
		});
	});

	describe("list view", () => {
		it("renders ul/li structure", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "list",
							name: "My List",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("obsidian-base-list");
			expect(result).toContain("<ul");
			expect(result).toContain("<li>");
			expect(result).toContain("</li>");
		});

		it("renders file.name as internal link in list", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "list",
							name: "My List",
							order: ["file.name", "author"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain(
				'<a href="/notes/gatsby/" class="internal-link">The Great Gatsby</a>',
			);
		});

		it("joins property values with em dash", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "list",
							name: "My List",
							order: ["file.name", "author", "year"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain(" — ");
		});
	});

	describe("grouped view", () => {
		it("renders group headers for all view types", () => {
			const groups = [
				{ key: "Fiction", rows: [basicRows[0], basicRows[1]] },
				{ key: "Non-Fiction", rows: [basicRows[2]] },
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Grouped",
							order: ["file.name", "author"],
						},
						basicRows,
						groups,
					),
				]),
			);
			expect(result).toContain("obsidian-base-group-row");
			expect(result).toContain("obsidian-base-group-label");
			expect(result).toContain("Fiction");
			expect(result).toContain("Non-Fiction");
		});

		it("renders grouped cards view", () => {
			const groups = [
				{ key: "Fiction", rows: [basicRows[0]] },
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "cards",
							name: "Grouped Cards",
							order: ["file.name", "author"],
						},
						basicRows,
						groups,
					),
				]),
			);
			expect(result).toContain("obsidian-base-group");
			expect(result).toContain("obsidian-base-cards");
		});

		it("renders grouped list view", () => {
			const groups = [
				{ key: "Fiction", rows: [basicRows[0]] },
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "list",
							name: "Grouped List",
							order: ["file.name", "author"],
						},
						basicRows,
						groups,
					),
				]),
			);
			expect(result).toContain("obsidian-base-group");
			expect(result).toContain("obsidian-base-list");
		});
	});

	describe("multi-view tab switcher", () => {
		it("renders tab switcher when >1 view", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Table View",
							order: ["file.name"],
						},
						basicRows,
					),
					singleView(
						{
							type: "list",
							name: "List View",
							order: ["file.name"],
						},
						basicRows,
					),
				]),
			);
			expect(result).toContain("obsidian-bases-views");
			expect(result).toContain("obsidian-bases-dropdown");
			expect(result).toContain("obsidian-bases-active-view");
			expect(result).toContain("Table View");
			expect(result).toContain("List View");
			expect(result).toContain('data-view-index="0"');
			expect(result).toContain('data-view-index="1"');
		});

		it("does not render tab switcher for single view", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Only View",
							order: ["file.name"],
						},
						basicRows,
					),
				]),
			);
			expect(result).not.toContain("obsidian-bases-view-switcher");
		});

		it("first panel is visible, rest are hidden", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "View 1",
							order: ["file.name"],
						},
						basicRows,
					),
					singleView(
						{
							type: "list",
							name: "View 2",
							order: ["file.name"],
						},
						basicRows,
					),
				]),
			);
			// First panel should not have display:none
			const panels = result.match(
				/obsidian-bases-view-panel[^>]*>/g,
			);
			expect(panels).toHaveLength(2);
			// Second panel should be hidden
			expect(result).toContain('style="display:none"');
		});
	});

	describe("empty result", () => {
		it("renders a message when no rows", () => {
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Empty",
							order: ["file.name"],
						},
						[],
					),
				]),
			);
			expect(result).toContain("No results");
		});
	});

	describe("formula values in table", () => {
		it("renders formula values from __formulas", () => {
			const rows = [
				makeRow("Test", "/notes/test/", { author: "A" }, { readingTime: 42 }),
			];
			const result = renderViews(
				makeQueryResult([
					singleView(
						{
							type: "table",
							name: "Formulas",
							order: ["file.name", "readingTime"],
						},
						rows,
					),
				]),
			);
			expect(result).toContain("42");
		});
	});
});
