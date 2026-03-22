import { describe, it, expect } from "vitest";
import { parseExpression } from "../exprParser.js";

describe("parseExpression", () => {
	describe("simple comparisons", () => {
		it('parses status == "active"', () => {
			const ast = parseExpression('status == "active"');
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("==");
			expect(ast.left.name).toBe("status");
			expect(ast.right.value).toBe("active");
		});

		it("parses year > 2020", () => {
			const ast = parseExpression("year > 2020");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe(">");
			expect(ast.left.name).toBe("year");
			expect(ast.right.value).toBe(2020);
		});

		it("parses year != 2019", () => {
			const ast = parseExpression("year != 2019");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("!=");
			expect(ast.left.name).toBe("year");
			expect(ast.right.value).toBe(2019);
		});

		it("parses year >= 2020", () => {
			const ast = parseExpression("year >= 2020");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe(">=");
			expect(ast.left.name).toBe("year");
			expect(ast.right.value).toBe(2020);
		});

		it("parses year <= 2020", () => {
			const ast = parseExpression("year <= 2020");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("<=");
			expect(ast.left.name).toBe("year");
			expect(ast.right.value).toBe(2020);
		});
	});

	describe("member access", () => {
		it("parses file.name", () => {
			const ast = parseExpression("file.name");
			expect(ast.type).toBe("MemberExpression");
			expect(ast.object.name).toBe("file");
			expect(ast.property.name).toBe("name");
		});

		it("parses file.folder", () => {
			const ast = parseExpression("file.folder");
			expect(ast.type).toBe("MemberExpression");
			expect(ast.object.name).toBe("file");
			expect(ast.property.name).toBe("folder");
		});

		it("parses note.author", () => {
			const ast = parseExpression("note.author");
			expect(ast.type).toBe("MemberExpression");
			expect(ast.object.name).toBe("note");
			expect(ast.property.name).toBe("author");
		});
	});

	describe("function calls", () => {
		it('parses file.inFolder("books")', () => {
			const ast = parseExpression('file.inFolder("books")');
			expect(ast.type).toBe("CallExpression");
			expect(ast.callee.type).toBe("MemberExpression");
			expect(ast.callee.object.name).toBe("file");
			expect(ast.callee.property.name).toBe("inFolder");
			expect(ast.arguments).toHaveLength(1);
			expect(ast.arguments[0].value).toBe("books");
		});

		it('parses file.hasTag("fiction")', () => {
			const ast = parseExpression('file.hasTag("fiction")');
			expect(ast.type).toBe("CallExpression");
			expect(ast.callee.property.name).toBe("hasTag");
			expect(ast.arguments[0].value).toBe("fiction");
		});

		it('parses file.hasProperty("status")', () => {
			const ast = parseExpression('file.hasProperty("status")');
			expect(ast.type).toBe("CallExpression");
			expect(ast.callee.property.name).toBe("hasProperty");
			expect(ast.arguments[0].value).toBe("status");
		});
	});

	describe("method calls", () => {
		it('parses name.contains("test")', () => {
			const ast = parseExpression('name.contains("test")');
			expect(ast.type).toBe("CallExpression");
			expect(ast.callee.object.name).toBe("name");
			expect(ast.callee.property.name).toBe("contains");
			expect(ast.arguments[0].value).toBe("test");
		});

		it("parses (price / age).toFixed(2)", () => {
			const ast = parseExpression("(price / age).toFixed(2)");
			expect(ast.type).toBe("CallExpression");
			expect(ast.callee.type).toBe("MemberExpression");
			expect(ast.callee.property.name).toBe("toFixed");
			expect(ast.callee.object.type).toBe("BinaryExpression");
			expect(ast.callee.object.operator).toBe("/");
			expect(ast.arguments[0].value).toBe(2);
		});
	});

	describe("boolean logic", () => {
		it("parses a && b", () => {
			const ast = parseExpression("a && b");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("&&");
			expect(ast.left.name).toBe("a");
			expect(ast.right.name).toBe("b");
		});

		it("parses a || b", () => {
			const ast = parseExpression("a || b");
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("||");
			expect(ast.left.name).toBe("a");
			expect(ast.right.name).toBe("b");
		});

		it("parses !a", () => {
			const ast = parseExpression("!a");
			expect(ast.type).toBe("UnaryExpression");
			expect(ast.operator).toBe("!");
			expect(ast.argument.name).toBe("a");
		});
	});

	describe("complex expressions", () => {
		it('parses status == "read" && year > 2020', () => {
			const ast = parseExpression('status == "read" && year > 2020');
			expect(ast.type).toBe("BinaryExpression");
			expect(ast.operator).toBe("&&");
			expect(ast.left.type).toBe("BinaryExpression");
			expect(ast.left.operator).toBe("==");
			expect(ast.right.type).toBe("BinaryExpression");
			expect(ast.right.operator).toBe(">");
		});
	});

	describe("error cases", () => {
		it("throws on empty string", () => {
			expect(() => parseExpression("")).toThrow();
		});

		it("throws on whitespace-only string", () => {
			expect(() => parseExpression("   ")).toThrow();
		});

		it("throws on null", () => {
			expect(() => parseExpression(null)).toThrow();
		});

		it("throws on undefined", () => {
			expect(() => parseExpression(undefined)).toThrow();
		});

		it("throws on non-string input", () => {
			expect(() => parseExpression(42)).toThrow();
			expect(() => parseExpression({})).toThrow();
			expect(() => parseExpression([])).toThrow();
		});
	});
});
