import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evalExpr, evalFilter } from "../exprEval.js";
import { parseExpression } from "../exprParser.js";

// Helper to evaluate expression string against a note
function evaluate(expr, note, formulas = {}, context = {}) {
	const ast = parseExpression(expr);
	return evalExpr(ast, note, formulas, context);
}

const sampleNote = {
	path: "books/The Great Gatsby.md",
	url: "/notes/the-great-gatsby/",
	metadata: {
		tags: ["note", "fiction", "classic"],
		author: "Fitzgerald",
		year: 1925,
		rating: 4.5,
		status: "read",
		links: ["other-note", "another-note"],
	},
	fileSlug: "the-great-gatsby",
	__formulas: { readingTime: 5 },
};

describe("exprEval", () => {
	describe("property resolution", () => {
		it("resolves simple identifier from metadata", () => {
			expect(evaluate("author", sampleNote)).toBe("Fitzgerald");
		});

		it("resolves note.property from metadata", () => {
			expect(evaluate("note.author", sampleNote)).toBe("Fitzgerald");
		});

		it('resolves note["property"] from metadata', () => {
			expect(evaluate('note["author"]', sampleNote)).toBe("Fitzgerald");
		});

		it("resolves file.name to filename without extension", () => {
			expect(evaluate("file.name", sampleNote)).toBe("The Great Gatsby");
		});

		it("resolves file.path", () => {
			expect(evaluate("file.path", sampleNote)).toBe(
				"books/The Great Gatsby.md",
			);
		});

		it("resolves file.folder", () => {
			expect(evaluate("file.folder", sampleNote)).toBe("books");
		});

		it("resolves file.ext", () => {
			expect(evaluate("file.ext", sampleNote)).toBe("md");
		});

		it("resolves file.tags (system tags filtered out)", () => {
			expect(evaluate("file.tags", sampleNote)).toEqual([
				"fiction",
				"classic",
			]);
		});

		it("resolves formula.X from __formulas", () => {
			expect(evaluate("formula.readingTime", sampleNote)).toBe(5);
		});

		it("resolves formula.X from formulas parameter", () => {
			expect(evaluate("formula.custom", sampleNote, { custom: 42 })).toBe(42);
		});

		it("returns undefined for missing metadata property", () => {
			expect(evaluate("nonexistent", sampleNote)).toBeUndefined();
		});

		it("resolves file.size from metadata", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, size: 1024 },
			};
			expect(evaluate("file.size", note)).toBe(1024);
		});

		it("resolves file.ctime and file.mtime from metadata", () => {
			const note = {
				...sampleNote,
				metadata: {
					...sampleNote.metadata,
					ctime: "2024-01-01",
					mtime: "2024-06-01",
				},
			};
			expect(evaluate("file.ctime", note)).toBe("2024-01-01");
			expect(evaluate("file.mtime", note)).toBe("2024-06-01");
		});
	});

	describe("literals", () => {
		it("evaluates string literal", () => {
			expect(evaluate('"hello"', sampleNote)).toBe("hello");
		});

		it("evaluates numeric literal", () => {
			expect(evaluate("42", sampleNote)).toBe(42);
		});

		it("evaluates boolean-like via identifier", () => {
			expect(evaluate("true", sampleNote)).toBe(true);
			expect(evaluate("false", sampleNote)).toBe(false);
		});
	});

	describe("comparison operators", () => {
		it("evaluates == with loose equality", () => {
			expect(evaluate('author == "Fitzgerald"', sampleNote)).toBe(true);
			expect(evaluate('author == "Other"', sampleNote)).toBe(false);
		});

		it("evaluates !=", () => {
			expect(evaluate('author != "Other"', sampleNote)).toBe(true);
			expect(evaluate('author != "Fitzgerald"', sampleNote)).toBe(false);
		});

		it("evaluates >", () => {
			expect(evaluate("year > 1900", sampleNote)).toBe(true);
			expect(evaluate("year > 2000", sampleNote)).toBe(false);
		});

		it("evaluates <", () => {
			expect(evaluate("year < 2000", sampleNote)).toBe(true);
			expect(evaluate("year < 1900", sampleNote)).toBe(false);
		});

		it("evaluates >=", () => {
			expect(evaluate("year >= 1925", sampleNote)).toBe(true);
			expect(evaluate("year >= 1926", sampleNote)).toBe(false);
		});

		it("evaluates <=", () => {
			expect(evaluate("year <= 1925", sampleNote)).toBe(true);
			expect(evaluate("year <= 1924", sampleNote)).toBe(false);
		});
	});

	describe("arithmetic operators", () => {
		it("evaluates addition", () => {
			expect(evaluate("year + 1", sampleNote)).toBe(1926);
		});

		it("evaluates subtraction", () => {
			expect(evaluate("year - 25", sampleNote)).toBe(1900);
		});

		it("evaluates multiplication", () => {
			expect(evaluate("rating * 2", sampleNote)).toBe(9);
		});

		it("evaluates division", () => {
			expect(evaluate("rating / 2", sampleNote)).toBe(2.25);
		});

		it("evaluates modulo", () => {
			expect(evaluate("year % 100", sampleNote)).toBe(25);
		});

		it("division by zero returns undefined", () => {
			expect(evaluate("5 / 0", sampleNote)).toBeUndefined();
		});
	});

	describe("boolean logic", () => {
		it("evaluates && (both true)", () => {
			expect(
				evaluate('author == "Fitzgerald" && year == 1925', sampleNote),
			).toBe(true);
		});

		it("evaluates && (one false)", () => {
			expect(evaluate('author == "Fitzgerald" && year > 2000', sampleNote)).toBe(
				false,
			);
		});

		it("evaluates || (one true)", () => {
			expect(evaluate('author == "Other" || year == 1925', sampleNote)).toBe(
				true,
			);
		});

		it("evaluates || (both false)", () => {
			expect(evaluate('author == "Other" || year > 2000', sampleNote)).toBe(
				false,
			);
		});

		it("evaluates unary !", () => {
			expect(evaluate('!(author == "Other")', sampleNote)).toBe(true);
			expect(evaluate('!(author == "Fitzgerald")', sampleNote)).toBe(false);
		});

		it("evaluates unary -", () => {
			expect(evaluate("-year", sampleNote)).toBe(-1925);
		});
	});

	describe("filter functions", () => {
		it('file.hasTag("fiction") returns true', () => {
			expect(evaluate('file.hasTag("fiction")', sampleNote)).toBe(true);
		});

		it('file.hasTag("nonexistent") returns false', () => {
			expect(evaluate('file.hasTag("nonexistent")', sampleNote)).toBe(false);
		});

		it("file.hasTag with # prefix", () => {
			expect(evaluate('file.hasTag("#fiction")', sampleNote)).toBe(true);
		});

		it('file.inFolder("books") returns true', () => {
			expect(evaluate('file.inFolder("books")', sampleNote)).toBe(true);
		});

		it('file.inFolder("other") returns false', () => {
			expect(evaluate('file.inFolder("other")', sampleNote)).toBe(false);
		});

		it('file.inFolder("books/") with trailing slash still matches', () => {
			expect(evaluate('file.inFolder("books/")', sampleNote)).toBe(true);
		});

		it('file.hasProperty("author") returns true', () => {
			expect(evaluate('file.hasProperty("author")', sampleNote)).toBe(true);
		});

		it('file.hasProperty("nonexistent") returns false', () => {
			expect(evaluate('file.hasProperty("nonexistent")', sampleNote)).toBe(
				false,
			);
		});

		it('file.hasLink("other-note") returns true', () => {
			expect(evaluate('file.hasLink("other-note")', sampleNote)).toBe(true);
		});

		it('file.hasLink("missing") returns false', () => {
			expect(evaluate('file.hasLink("missing")', sampleNote)).toBe(false);
		});
	});

	describe("global functions", () => {
		it("today() returns a Date object", () => {
			const result = evaluate("today()", sampleNote);
			expect(result instanceof Date).toBe(true);
		});

		it("today() returns midnight (time zeroed)", () => {
			const result = evaluate("today()", sampleNote);
			expect(result.getHours()).toBe(0);
			expect(result.getMinutes()).toBe(0);
			expect(result.getSeconds()).toBe(0);
			expect(result.getMilliseconds()).toBe(0);
		});

		it("today() supports .year chaining", () => {
			const result = evaluate("today().year", sampleNote);
			expect(typeof result).toBe("number");
			expect(result).toBeGreaterThan(2000);
		});

		it("today() supports .month chaining", () => {
			const result = evaluate("today().month", sampleNote);
			expect(typeof result).toBe("number");
			expect(result).toBeGreaterThanOrEqual(1);
			expect(result).toBeLessThanOrEqual(12);
		});

		it("today() supports .day chaining", () => {
			const result = evaluate("today().day", sampleNote);
			expect(typeof result).toBe("number");
			expect(result).toBeGreaterThanOrEqual(1);
			expect(result).toBeLessThanOrEqual(31);
		});

		it("today() supports .format() chaining", () => {
			const result = evaluate('today().format("YYYY-MM-DD")', sampleNote);
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it("now() returns a Date object", () => {
			const result = evaluate("now()", sampleNote);
			expect(result instanceof Date).toBe(true);
		});

		it("now() returns current time (within 5 seconds)", () => {
			const before = Date.now();
			const result = evaluate("now()", sampleNote);
			const after = Date.now();
			expect(result.getTime()).toBeGreaterThanOrEqual(before);
			expect(result.getTime()).toBeLessThanOrEqual(after);
		});

		it("if(condition, trueVal, falseVal) returns correct branch", () => {
			expect(evaluate('if(year > 1900, "yes", "no")', sampleNote)).toBe("yes");
			expect(evaluate('if(year > 2000, "yes", "no")', sampleNote)).toBe("no");
		});

		it("number() converts to number", () => {
			expect(evaluate('number("42")', sampleNote)).toBe(42);
		});

		it("min() returns minimum", () => {
			expect(evaluate("min(3, 1, 2)", sampleNote)).toBe(1);
		});

		it("max() returns maximum", () => {
			expect(evaluate("max(3, 1, 2)", sampleNote)).toBe(3);
		});

		it("list() wraps value in array", () => {
			expect(evaluate('list("hello")', sampleNote)).toEqual(["hello"]);
		});

		it("list() returns array as-is", () => {
			expect(evaluate("list(file.tags)", sampleNote)).toEqual([
				"fiction",
				"classic",
			]);
		});

		it("list() with multiple args returns all args", () => {
			expect(evaluate("list(1, 2, 3)", sampleNote)).toEqual([1, 2, 3]);
		});

		it("date() returns Date object", () => {
			const result = evaluate('date("2024-01-15")', sampleNote);
			expect(result instanceof Date).toBe(true);
			expect(result.getFullYear()).toBe(2024);
		});

		it("date(undefined) returns undefined", () => {
			expect(evaluate("date(undefined)", sampleNote)).toBeUndefined();
		});

		it('date("not-a-date") returns undefined', () => {
			expect(evaluate('date("not-a-date")', sampleNote)).toBeUndefined();
		});
	});

	describe("string methods", () => {
		it(".contains() checks inclusion", () => {
			expect(evaluate('author.contains("Fitz")', sampleNote)).toBe(true);
			expect(evaluate('author.contains("Hem")', sampleNote)).toBe(false);
		});

		it(".lower() converts to lowercase", () => {
			expect(evaluate("author.lower()", sampleNote)).toBe("fitzgerald");
		});

		it(".upper() converts to uppercase", () => {
			expect(evaluate("author.upper()", sampleNote)).toBe("FITZGERALD");
		});

		it(".title() converts to title case", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, word: "hello world" },
			};
			expect(evaluate("word.title()", note)).toBe("Hello World");
		});

		it(".trim() removes whitespace", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, padded: "  hello  " },
			};
			expect(evaluate("padded.trim()", note)).toBe("hello");
		});

		it('.split() splits string by separator', () => {
			expect(evaluate('author.split("g")', sampleNote)).toEqual([
				"Fitz",
				"erald",
			]);
		});

		it(".replace() replaces substring", () => {
			expect(evaluate('author.replace("gerald", "patrick")', sampleNote)).toBe(
				"Fitzpatrick",
			);
		});

		it(".startsWith() checks prefix", () => {
			expect(evaluate('author.startsWith("Fitz")', sampleNote)).toBe(true);
			expect(evaluate('author.startsWith("Hem")', sampleNote)).toBe(false);
		});

		it(".endsWith() checks suffix", () => {
			expect(evaluate('author.endsWith("ald")', sampleNote)).toBe(true);
		});

		it(".slice() extracts substring", () => {
			expect(evaluate("author.slice(0, 4)", sampleNote)).toBe("Fitz");
		});

		it(".length returns string length", () => {
			expect(evaluate("author.length", sampleNote)).toBe(10);
		});

		it(".isEmpty() checks empty string", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, empty: "" },
			};
			expect(evaluate("empty.isEmpty()", note)).toBe(true);
			expect(evaluate("author.isEmpty()", sampleNote)).toBe(false);
		});

		it(".isEmpty() returns true for missing property", () => {
			expect(evaluate("nonexistent.isEmpty()", sampleNote)).toBe(true);
		});
	});

	describe("number methods", () => {
		it(".abs() returns absolute value", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, temp: -5 },
			};
			expect(evaluate("temp.abs()", note)).toBe(5);
		});

		it(".ceil() rounds up", () => {
			expect(evaluate("rating.ceil()", sampleNote)).toBe(5);
		});

		it(".floor() rounds down", () => {
			expect(evaluate("rating.floor()", sampleNote)).toBe(4);
		});

		it(".round() rounds to nearest integer", () => {
			expect(evaluate("rating.round()", sampleNote)).toBe(5);
		});

		it(".round(digits) rounds to N digits", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, pi: 3.14159 },
			};
			expect(evaluate("pi.round(2)", note)).toBe(3.14);
		});

		it(".toFixed(precision) returns fixed-point string", () => {
			expect(evaluate("rating.toFixed(2)", sampleNote)).toBe("4.50");
		});

		it(".isEmpty() returns false for numbers", () => {
			expect(evaluate("year.isEmpty()", sampleNote)).toBe(false);
		});
	});

	describe("list methods", () => {
		it(".contains() checks array inclusion", () => {
			expect(evaluate('file.tags.contains("fiction")', sampleNote)).toBe(true);
			expect(evaluate('file.tags.contains("missing")', sampleNote)).toBe(false);
		});

		it(".containsAll() checks all present", () => {
			expect(
				evaluate(
					'file.tags.containsAll("fiction", "classic")',
					sampleNote,
				),
			).toBe(true);
			expect(
				evaluate(
					'file.tags.containsAll("fiction", "missing")',
					sampleNote,
				),
			).toBe(false);
		});

		it(".containsAny() checks any present", () => {
			expect(
				evaluate(
					'file.tags.containsAny("fiction", "missing")',
					sampleNote,
				),
			).toBe(true);
			expect(
				evaluate(
					'file.tags.containsAny("missing1", "missing2")',
					sampleNote,
				),
			).toBe(false);
		});

		it('.join() joins array elements', () => {
			expect(evaluate('file.tags.join(", ")', sampleNote)).toBe(
				"fiction, classic",
			);
		});

		it(".sort() returns sorted array", () => {
			expect(evaluate("file.tags.sort()", sampleNote)).toEqual([
				"classic",
				"fiction",
			]);
		});

		it(".unique() removes duplicates", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, tags: ["a", "b", "a", "c"] },
			};
			expect(evaluate("file.tags.unique()", note)).toEqual(["a", "b", "c"]);
		});

		it(".flat() flattens nested arrays", () => {
			const note = {
				...sampleNote,
				metadata: {
					...sampleNote.metadata,
					nested: [
						[1, 2],
						[3, 4],
					],
				},
			};
			expect(evaluate("nested.flat()", note)).toEqual([1, 2, 3, 4]);
		});

		it(".length returns array length", () => {
			expect(evaluate("file.tags.length", sampleNote)).toBe(2);
		});

		it(".isEmpty() checks empty array", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, emptyArr: [] },
			};
			expect(evaluate("emptyArr.isEmpty()", note)).toBe(true);
			expect(evaluate("file.tags.isEmpty()", sampleNote)).toBe(false);
		});

		it(".reverse() reverses array", () => {
			expect(evaluate("file.tags.reverse()", sampleNote)).toEqual([
				"classic",
				"fiction",
			]);
		});

		it(".slice() extracts subarray", () => {
			expect(evaluate("file.tags.slice(0, 2)", sampleNote)).toEqual([
				"fiction",
				"classic",
			]);
		});
	});

	describe("date fields and methods", () => {
		it(".year, .month, .day on Date", () => {
			const result = evaluate('date("2024-06-15").year', sampleNote);
			expect(result).toBe(2024);
		});

		it(".month on Date", () => {
			const result = evaluate('date("2024-06-15").month', sampleNote);
			expect(result).toBe(6);
		});

		it(".day on Date", () => {
			const result = evaluate('date("2024-06-15").day', sampleNote);
			expect(result).toBe(15);
		});

		it(".format() formats date", () => {
			const result = evaluate(
				'date("2024-06-15").format("YYYY-MM-DD")',
				sampleNote,
			);
			expect(result).toBe("2024-06-15");
		});

		it(".isEmpty() returns false for dates", () => {
			const result = evaluate('date("2024-06-15").isEmpty()', sampleNote);
			expect(result).toBe(false);
		});

		it(".hour on Date returns hours", () => {
			const note = {
				...sampleNote,
				metadata: {
					...sampleNote.metadata,
					ts: new Date(2024, 5, 15, 14, 30, 45),
				},
			};
			expect(evaluate("ts.hour", note)).toBe(14);
		});

		it(".minute on Date returns minutes", () => {
			const note = {
				...sampleNote,
				metadata: {
					...sampleNote.metadata,
					ts: new Date(2024, 5, 15, 14, 30, 45),
				},
			};
			expect(evaluate("ts.minute", note)).toBe(30);
		});

		it(".second on Date returns seconds", () => {
			const note = {
				...sampleNote,
				metadata: {
					...sampleNote.metadata,
					ts: new Date(2024, 5, 15, 14, 30, 45),
				},
			};
			expect(evaluate("ts.second", note)).toBe(45);
		});

		it(".relative() on today's exact time returns 'today'", () => {
			// Use current time so diffMs ≈ 0 ms → diffDays rounds to 0
			const now = new Date();
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, now },
			};
			expect(evaluate("now.relative()", note)).toBe("today");
		});

		it(".relative() on a past date returns 'X days ago'", () => {
			// Use exactly 10 * 24h ago to avoid rounding ambiguity
			const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, past },
			};
			expect(evaluate("past.relative()", note)).toBe("10 days ago");
		});

		it(".relative() on a future date returns 'in X days'", () => {
			// Use exactly 10 * 24h ahead to avoid rounding ambiguity
			const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, future },
			};
			expect(evaluate("future.relative()", note)).toBe("in 10 days");
		});
	});

	describe("conditional expression", () => {
		it("evaluates ternary", () => {
			expect(evaluate('year > 2000 ? "new" : "old"', sampleNote)).toBe("old");
			expect(evaluate('year < 2000 ? "old" : "new"', sampleNote)).toBe("old");
		});
	});

	describe("array expression", () => {
		it("evaluates array literal", () => {
			expect(evaluate("[1, 2, 3]", sampleNote)).toEqual([1, 2, 3]);
		});
	});

	describe("evalFilter convenience function", () => {
		it("parses and evaluates, returns boolean", () => {
			expect(evalFilter('author == "Fitzgerald"', sampleNote)).toBe(true);
			expect(evalFilter("year > 2000", sampleNote)).toBe(false);
		});

		it("handles complex filter expressions", () => {
			expect(
				evalFilter(
					'file.hasTag("fiction") && year < 2000',
					sampleNote,
				),
			).toBe(true);
		});

		it("returns false for errors", () => {
			expect(evalFilter("", sampleNote)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("handles null metadata values", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, nullVal: null },
			};
			expect(evaluate("nullVal", note)).toBeNull();
		});

		it("handles missing properties gracefully", () => {
			expect(evaluate("missing", sampleNote)).toBeUndefined();
		});

		it("handles nested member access on metadata objects", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, nested: { deep: "value" } },
			};
			expect(evaluate("nested.deep", note)).toBe("value");
		});

		it("handles note with no __formulas", () => {
			const note = { ...sampleNote, __formulas: undefined };
			expect(evaluate("formula.readingTime", note, { readingTime: 10 })).toBe(
				10,
			);
		});

		it("handles note with no tags", () => {
			const note = {
				...sampleNote,
				metadata: { ...sampleNote.metadata, tags: undefined },
			};
			expect(evaluate('file.hasTag("fiction")', note)).toBe(false);
		});

		it("file.folder for root-level file", () => {
			const note = { ...sampleNote, path: "README.md" };
			expect(evaluate("file.folder", note)).toBe("");
		});
	});

	describe("dg-note-properties nested lookup", () => {
		const nestedNote = {
			path: "books/Dune.md",
			url: "/notes/dune/",
			metadata: {
				"dg-publish": true,
				permalink: "/notes/dune/",
				tags: ["note"],
				"dg-note-properties": {
					author: "Frank Herbert",
					year: 1965,
					rating: 4.8,
					date: "not a valid 11ty date",
					status: "read",
				},
			},
			fileSlug: "dune",
		};

		it("resolves identifier from nested dg-note-properties", () => {
			expect(evaluate("author", nestedNote)).toBe("Frank Herbert");
		});

		it("resolves note.property from nested", () => {
			expect(evaluate("note.year", nestedNote)).toBe(1965);
		});

		it("resolves property that would crash 11ty at top level (date)", () => {
			expect(evaluate("date", nestedNote)).toBe("not a valid 11ty date");
		});

		it("file.hasProperty finds nested properties", () => {
			expect(evaluate('file.hasProperty("author")', nestedNote)).toBe(true);
			expect(evaluate('file.hasProperty("nonexistent")', nestedNote)).toBe(false);
		});

		it("evalFilter works with nested properties", () => {
			expect(evalFilter('year > 1960', nestedNote)).toBe(true);
			expect(evalFilter('status == "read"', nestedNote)).toBe(true);
		});

		it("falls back to top-level metadata when not in nested", () => {
			expect(evaluate("permalink", nestedNote)).toBe("/notes/dune/");
		});

		it("nested takes precedence over top-level", () => {
			const note = {
				path: "test.md",
				metadata: {
					status: "top-level",
					"dg-note-properties": { status: "nested" },
				},
			};
			expect(evaluate("status", note)).toBe("nested");
		});
	});
});
