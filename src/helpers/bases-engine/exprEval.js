const { parseExpression } = require("./exprParser");

/**
 * Get a user-defined property from note metadata.
 * Checks "dg-note-properties" (nested/safe) first, then falls back
 * to top-level metadata for backwards compatibility.
 */
function getUserProperty(metadata, key) {
	if (!metadata) return undefined;
	const nested = metadata["dg-note-properties"];
	if (nested && key in nested) return nested[key];
	if (key in metadata) return metadata[key];
	return undefined;
}

/**
 * Check if a user-defined property exists on the note.
 */
function hasUserProperty(metadata, key) {
	if (!metadata) return false;
	const nested = metadata["dg-note-properties"];
	if (nested && key in nested) return true;
	return key in metadata;
}

// Tags injected by the plugin that aren't real user tags
const SYSTEM_TAGS = new Set(["note", "gardenEntry"]);

// --- Date coercion ---
// Published date properties arrive as ISO strings ("1707-04-17"), not Date
// objects, so date methods/fields/comparisons coerce them on demand.

const ISO_DATE_STRING_REGEX =
	/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function isISODateString(value) {
	return typeof value === "string" && ISO_DATE_STRING_REGEX.test(value.trim());
}

/**
 * Convert an ISO date string to a Date. Date-only strings are parsed as
 * local time (matching Obsidian), not UTC as new Date() would.
 */
function coerceDate(value) {
	if (value instanceof Date) return value;
	if (!isISODateString(value)) return null;
	const str = value.trim();
	const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (dateOnly) {
		return new Date(
			Number(dateOnly[1]),
			Number(dateOnly[2]) - 1,
			Number(dateOnly[3]),
		);
	}
	const d = new Date(str.replace(" ", "T"));
	return isNaN(d.getTime()) ? null : d;
}

const DATE_METHODS = new Set(["format", "date", "relative"]);
const DATE_FIELDS = new Set([
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
]);

// --- Link values ---
// link("Family") produces a link value; stored properties are wikilink
// strings ("[[Family]]", "[[Categories/Family|alias]]"). Targets match the
// way Obsidian resolves shortest paths: exact, or one path is a trailing
// segment of the other.

function makeLink(target) {
	return { __basesLink: true, target: String(target) };
}

/**
 * Extract a normalized link target from a link value or wikilink string.
 * Returns null when the value is neither.
 */
function linkTarget(value) {
	if (value && typeof value === "object" && value.__basesLink) {
		return value.target.toLowerCase().replace(/\.md$/, "");
	}
	if (typeof value === "string") {
		const match = value.trim().match(/^!?\[\[([^\]]+)\]\]$/);
		if (match) {
			const inner = match[1].split("|")[0].split("#")[0].trim();
			return inner.toLowerCase().replace(/\.md$/, "");
		}
	}
	return null;
}

function linkTargetsMatch(a, b) {
	return a === b || a.endsWith("/" + b) || b.endsWith("/" + a);
}

/**
 * Bases value equality: lists compare by value, links compare by target,
 * dates compare by time, everything else falls back to loose equality.
 */
function valuesEqual(a, b) {
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, i) => valuesEqual(item, b[i]));
	}
	// A scalar property compares equal to a single-element list literal,
	// matching how Obsidian treats single values and lists interchangeably.
	if (Array.isArray(a)) {
		return a.length === 1 && valuesEqual(a[0], b);
	}
	if (Array.isArray(b)) {
		return b.length === 1 && valuesEqual(a, b[0]);
	}

	const aLink = linkTarget(a);
	const bLink = linkTarget(b);
	if (aLink !== null && bLink !== null) {
		return linkTargetsMatch(aLink, bLink);
	}

	if (a instanceof Date || b instanceof Date) {
		const aDate = coerceDate(a);
		const bDate = coerceDate(b);
		if (aDate && bDate) return aDate.getTime() === bDate.getTime();
	}

	// eslint-disable-next-line eqeqeq
	return a == b;
}

/**
 * Bases toString(): works on every type so filters like
 * categories.toString().contains("x") behave like Obsidian.
 */
function basesToString(obj) {
	if (obj == null) return "";
	if (Array.isArray(obj)) return obj.map(basesToString).join(", ");
	if (obj instanceof Date) return obj.toISOString();
	if (typeof obj === "object" && obj.__basesLink) {
		return "[[" + obj.target + "]]";
	}
	return String(obj);
}

/**
 * Bases isTruthy(): like JS truthiness, but empty lists are falsy.
 */
function basesIsTruthy(obj) {
	if (Array.isArray(obj)) return obj.length > 0;
	return Boolean(obj);
}

/**
 * Resolve a property name from a note's file metadata.
 */
function resolveFileProperty(prop, note) {
	if (!note.path) return undefined;
	switch (prop) {
		case "name": {
			const parts = note.path.split("/");
			const filename = parts[parts.length - 1];
			return filename.replace(/\.[^.]+$/, "");
		}
		case "path":
			return note.path;
		case "folder": {
			const lastSlash = note.path.lastIndexOf("/");
			return lastSlash === -1 ? "" : note.path.substring(0, lastSlash);
		}
		case "ext": {
			const dotIdx = note.path.lastIndexOf(".");
			return dotIdx === -1 ? "md" : note.path.substring(dotIdx + 1);
		}
		case "tags":
			return ((note.metadata && note.metadata.tags) || []).filter((t) => !SYSTEM_TAGS.has(t));
		case "links":
			return note._links || (note.metadata && note.metadata.links) || [];
		case "backlinks":
			return note._backlinks || (note.metadata && note.metadata.backlinks) || [];
		case "size":
		case "ctime":
		case "mtime":
			return note.metadata ? note.metadata[prop] : undefined;
		default:
			return undefined;
	}
}

/**
 * Resolve a file filter function call.
 */
function resolveFileMethod(method, args, note) {
	switch (method) {
		case "hasTag": {
			const tag = args[0];
			const tags = (note.metadata && note.metadata.tags) || [];
			const normalizedTag = tag.startsWith("#") ? tag.slice(1) : tag;
			return tags.some(
				(t) => t === normalizedTag || t === "#" + normalizedTag,
			);
		}
		case "inFolder": {
			const folder = args[0];
			const normalised = String(folder).replace(/\/$/, "");
			return note.path.startsWith(normalised + "/");
		}
		case "hasProperty": {
			const prop = args[0];
			return hasUserProperty(note.metadata, prop);
		}
		case "hasLink": {
			const link = args[0];
			const links = note._links || (note.metadata && note.metadata.links) || [];
			// Check both full URL paths and stem paths
			return links.some((l) => l === link || l.includes(link));
		}
		default:
			return undefined;
	}
}

/**
 * Call a method on a resolved value (string, number, array, Date).
 */
function callMethod(obj, method, args) {
	// isEmpty works on any type
	if (method === "isEmpty") {
		if (obj == null) return true;
		if (typeof obj === "string") return obj === "";
		if (Array.isArray(obj)) return obj.length === 0;
		if (obj instanceof Date) return false;
		if (typeof obj === "number") return false;
		return false;
	}

	// isTruthy and toString work on any type
	if (method === "isTruthy") {
		return basesIsTruthy(obj);
	}
	if (method === "toString") {
		return basesToString(obj);
	}

	// Published date properties are ISO strings; coerce them when a date
	// method is called so born.format("YYYY") works like in Obsidian.
	if (DATE_METHODS.has(method) && isISODateString(obj)) {
		obj = coerceDate(obj);
	}

	// String methods
	if (typeof obj === "string") {
		switch (method) {
			case "contains":
				return obj.includes(args[0]);
			case "lower":
				return obj.toLowerCase();
			case "upper":
				return obj.toUpperCase();
			case "title":
				return obj.replace(
					/\b\w/g,
					(c) => c.toUpperCase(),
				);
			case "trim":
				return obj.trim();
			case "split":
				return obj.split(args[0]);
			case "replace":
				return obj.replace(args[0], args[1]);
			case "startsWith":
				return obj.startsWith(args[0]);
			case "endsWith":
				return obj.endsWith(args[0]);
			case "slice":
				return args.length > 1
					? obj.slice(args[0], args[1])
					: obj.slice(args[0]);
		}
	}

	// Number methods
	if (typeof obj === "number") {
		switch (method) {
			case "abs":
				return Math.abs(obj);
			case "ceil":
				return Math.ceil(obj);
			case "floor":
				return Math.floor(obj);
			case "round": {
				if (args.length > 0 && args[0] != null) {
					const factor = Math.pow(10, args[0]);
					return Math.round(obj * factor) / factor;
				}
				return Math.round(obj);
			}
			case "toFixed":
				return obj.toFixed(args[0]);
		}
	}

	// Array methods
	if (Array.isArray(obj)) {
		switch (method) {
			case "contains":
				return obj.some((item) => valuesEqual(item, args[0]));
			case "containsAll":
				return args.every((a) =>
					obj.some((item) => valuesEqual(item, a)),
				);
			case "containsAny":
				return args.some((a) =>
					obj.some((item) => valuesEqual(item, a)),
				);
			case "join":
				return obj.join(args[0]);
			case "sort":
				return [...obj].sort();
			case "unique":
				return [...new Set(obj)];
			case "flat":
				return obj.flat();
			case "reverse":
				return [...obj].reverse();
			case "slice":
				return args.length > 1
					? obj.slice(args[0], args[1])
					: obj.slice(args[0]);
		}
	}

	// Date methods
	if (obj instanceof Date) {
		switch (method) {
			case "format": {
				const fmt = args[0] || "YYYY-MM-DD";
				return fmt
					.replace("YYYY", String(obj.getFullYear()))
					.replace("MM", String(obj.getMonth() + 1).padStart(2, "0"))
					.replace("DD", String(obj.getDate()).padStart(2, "0"))
					.replace("HH", String(obj.getHours()).padStart(2, "0"))
					.replace("mm", String(obj.getMinutes()).padStart(2, "0"))
					.replace("ss", String(obj.getSeconds()).padStart(2, "0"));
			}
			// falls through not possible due to return above
			case "date":
				return new Date(
					obj.getFullYear(),
					obj.getMonth(),
					obj.getDate(),
				);
			case "relative": {
				const now = new Date();
				const diffMs = now - obj;
				const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
				if (diffDays === 0) return "today";
				if (diffDays === 1) return "1 day ago";
				if (diffDays > 0) return diffDays + " days ago";
				if (diffDays === -1) return "in 1 day";
				return "in " + Math.abs(diffDays) + " days";
			}
		}
	}

	return undefined;
}

/**
 * Resolve a property access on a value (for .length and date fields).
 */
function resolveProperty(obj, prop) {
	if (prop === "length") {
		if (typeof obj === "string" || Array.isArray(obj)) return obj.length;
	}

	// born.year on a published ISO date string
	if (DATE_FIELDS.has(prop) && isISODateString(obj)) {
		obj = coerceDate(obj);
	}

	if (obj instanceof Date) {
		switch (prop) {
			case "year":
				return obj.getFullYear();
			case "month":
				return obj.getMonth() + 1;
			case "day":
				return obj.getDate();
			case "hour":
				return obj.getHours();
			case "minute":
				return obj.getMinutes();
			case "second":
				return obj.getSeconds();
		}
	}

	// Generic object property access
	if (obj != null && typeof obj === "object" && prop in obj) {
		return obj[prop];
	}

	return undefined;
}

/**
 * Evaluate a jsep AST node against a note data object.
 * @param {object} ast - The jsep AST node
 * @param {object} note - The note data object
 * @param {object} formulas - External formulas map
 * @param {object} context - Additional evaluation context
 * @returns {*} The evaluated result
 */
function evalExpr(ast, note, formulas, context) {
	if (!ast) return undefined;
	formulas = formulas || {};
	context = context || {};

	switch (ast.type) {
		case "Literal":
			return ast.value;

		case "Identifier": {
			const name = ast.name;
			if (name === "true") return true;
			if (name === "false") return false;
			if (name === "null") return null;
			if (name === "undefined") return undefined;
			// Look up in user properties, then metadata
			return getUserProperty(note.metadata, name);
		}

		case "MemberExpression": {
			const prop = ast.computed
				? evalExpr(ast.property, note, formulas, context)
				: ast.property.name;

			// Check if object is a special identifier
			if (ast.object.type === "Identifier") {
				const objName = ast.object.name;
				if (objName === "file") {
					return resolveFileProperty(prop, note);
				}
				if (objName === "note") {
					return getUserProperty(note.metadata, prop);
				}
				if (objName === "formula") {
					if (note.__formulas && note.__formulas[prop] !== undefined) {
						return note.__formulas[prop];
					}
					return formulas[prop];
				}
			}

			// General member expression: evaluate object first
			const obj = evalExpr(ast.object, note, formulas, context);
			return resolveProperty(obj, prop);
		}

		case "CallExpression": {
			// Check for file.method() pattern
			if (
				ast.callee.type === "MemberExpression" &&
				ast.callee.object.type === "Identifier" &&
				ast.callee.object.name === "file"
			) {
				const method = ast.callee.property.name;
				const fileMethods = [
					"hasTag",
					"inFolder",
					"hasProperty",
					"hasLink",
				];
				if (fileMethods.includes(method)) {
					const args = ast.arguments.map((a) =>
						evalExpr(a, note, formulas, context),
					);
					return resolveFileMethod(method, args, note);
				}
			}

			// Check for global functions
			if (ast.callee.type === "Identifier") {
				const funcName = ast.callee.name;
				const args = ast.arguments.map((a) =>
					evalExpr(a, note, formulas, context),
				);
				return callGlobalFunction(funcName, args);
			}

			// Method call on a value: obj.method(args)
			if (ast.callee.type === "MemberExpression") {
				const obj = evalExpr(ast.callee.object, note, formulas, context);
				const method = ast.callee.computed
					? evalExpr(ast.callee.property, note, formulas, context)
					: ast.callee.property.name;
				const args = ast.arguments.map((a) =>
					evalExpr(a, note, formulas, context),
				);

				// Handle isEmpty on undefined/null
				if (method === "isEmpty" && obj == null) return true;

				return callMethod(obj, method, args);
			}

			return undefined;
		}

		case "BinaryExpression": {
			// Short-circuit for logical operators
			if (ast.operator === "&&") {
				return (
					evalExpr(ast.left, note, formulas, context) &&
					evalExpr(ast.right, note, formulas, context)
				);
			}
			if (ast.operator === "||") {
				return (
					evalExpr(ast.left, note, formulas, context) ||
					evalExpr(ast.right, note, formulas, context)
				);
			}

			let left = evalExpr(ast.left, note, formulas, context);
			let right = evalExpr(ast.right, note, formulas, context);

			// Ordering comparisons between a Date (e.g. from date()/today())
			// and a published ISO date string compare as dates.
			if (
				[">", "<", ">=", "<="].includes(ast.operator) &&
				(left instanceof Date || right instanceof Date)
			) {
				const leftDate = coerceDate(left);
				const rightDate = coerceDate(right);
				if (leftDate && rightDate) {
					left = leftDate.getTime();
					right = rightDate.getTime();
				}
			}

			switch (ast.operator) {
				case "==":
					return valuesEqual(left, right);
				case "!=":
					return !valuesEqual(left, right);
				case ">":
					return left > right;
				case "<":
					return left < right;
				case ">=":
					return left >= right;
				case "<=":
					return left <= right;
				case "+":
					return left + right;
				case "-":
					return left - right;
				case "*":
					return left * right;
				case "/":
					if (right === 0) return undefined;
					return left / right;
				case "%":
					return left % right;
				default:
					return undefined;
			}
		}

		case "UnaryExpression": {
			const arg = evalExpr(ast.argument, note, formulas, context);
			switch (ast.operator) {
				case "!":
					return !arg;
				case "-":
					return -arg;
				default:
					return undefined;
			}
		}

		case "ConditionalExpression": {
			const test = evalExpr(ast.test, note, formulas, context);
			return test
				? evalExpr(ast.consequent, note, formulas, context)
				: evalExpr(ast.alternate, note, formulas, context);
		}

		case "ArrayExpression": {
			return ast.elements.map((el) =>
				evalExpr(el, note, formulas, context),
			);
		}

		case "Compound": {
			// Evaluate all expressions, return last
			let result;
			for (const expr of ast.body) {
				result = evalExpr(expr, note, formulas, context);
			}
			return result;
		}

		default:
			return undefined;
	}
}

/**
 * Call a global function by name.
 */
function callGlobalFunction(name, args) {
	switch (name) {
		case "today": {
			const d = new Date();
			d.setHours(0, 0, 0, 0);
			d._basesType = "today";
			return d;
		}
		case "now": {
			const d = new Date();
			d._basesType = "now";
			return d;
		}
		case "date": {
			const d = new Date(args[0]);
			return isNaN(d.getTime()) ? undefined : d;
		}
		case "if":
			return basesIsTruthy(args[0]) ? args[1] : args[2];
		case "link":
			return makeLink(args[0]);
		case "number":
			return Number(args[0]);
		case "min":
			return Math.min(...args);
		case "max":
			return Math.max(...args);
		case "list":
			return args.length === 1 && Array.isArray(args[0]) ? args[0] : args.length === 1 ? [args[0]] : args;
		default:
			return undefined;
	}
}

/**
 * Convenience function: parse expression string and evaluate as boolean filter.
 * @param {string} expression - The expression string
 * @param {object} note - The note data object
 * @param {object} formulas - External formulas map
 * @returns {boolean}
 */
function evalFilter(expression, note, formulas) {
	try {
		const ast = parseExpression(expression);
		return Boolean(evalExpr(ast, note, formulas || {}));
	} catch {
		return false;
	}
}

module.exports = { evalExpr, evalFilter };
