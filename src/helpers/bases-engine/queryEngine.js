const yaml = require("yaml");
const { parseExpression } = require("./exprParser");
const { evalExpr, evalFilter } = require("./exprEval");

/**
 * Get a user property from metadata, checking "dg-note-properties" first.
 */
function getUserProperty(metadata, key) {
	if (!metadata) return undefined;
	const nested = metadata["dg-note-properties"];
	if (nested && key in nested) return nested[key];
	if (key in metadata) return metadata[key];
	return undefined;
}

/**
 * Execute a base query against an array of notes.
 * @param {string} yamlContent - YAML query string
 * @param {Array} notes - Array of note objects
 * @returns {object} Structured result with properties and views
 */
function executeBaseQuery(yamlContent, notes) {
	let parsed;
	try {
		parsed = yaml.parse(yamlContent.replace(/\\\|/g, "|"));
	} catch (err) {
		throw new Error("Failed to parse YAML: " + err.message);
	}

	if (!parsed || !Array.isArray(parsed.views) || parsed.views.length === 0) {
		throw new Error("Query must contain a 'views' array with at least one view");
	}

	const globalFilters = parsed.filters || null;
	const formulas = parsed.formulas || {};
	const properties = parsed.properties || {};
	const globalSummaries = parsed.summaries || {};

	const views = parsed.views.map((viewDef) => {
		return processView(viewDef, notes, globalFilters, formulas, globalSummaries);
	});

	return { properties, views };
}

/**
 * Process a single view definition.
 */
function processView(viewDef, notes, globalFilters, formulas, globalSummaries) {
	const config = {
		type: viewDef.type || "table",
		name: viewDef.name || "Untitled",
		limit: viewDef.limit != null ? viewDef.limit : null,
		groupBy: viewDef.groupBy || null,
		order: viewDef.order || null,
		sort: viewDef.sort || null,
		summaries: viewDef.summaries || null,
		// Cards-specific options
		image: viewDef.image || null,
		imageFit: viewDef.imageFit || null,
		imageAspectRatio: viewDef.imageAspectRatio || null,
		cardSize: viewDef.cardSize || null,
		// Table-specific options
		rowHeight: viewDef.rowHeight || null,
	};

	// 1. Compute formulas
	// Parse each formula expression once (not once per note)
	const parsedFormulas = Object.entries(formulas).map(([key, expr]) => {
		try {
			return [key, parseExpression(expr)];
		} catch {
			return [key, null];
		}
	});

	let rows = notes.map((note) => {
		const computed = {};
		for (const [key, ast] of parsedFormulas) {
			try {
				computed[key] = ast ? evalExpr(ast, note, {}) : undefined;
			} catch {
				computed[key] = undefined;
			}
		}
		return { ...note, __formulas: computed };
	});

	// 2. Apply global filters
	if (globalFilters) {
		rows = applyFilterBlock(rows, globalFilters);
	}

	// 3. Apply view-level filters
	if (viewDef.filters) {
		rows = applyFilterBlock(rows, viewDef.filters);
	}

	// 4. Sort
	rows = applySorting(rows, config);

	// 5. Group
	let groups = null;
	if (config.groupBy) {
		groups = applyGrouping(rows, config.groupBy);
	}

	// 6. Limit
	if (config.limit) {
		if (groups) {
			groups = applyGroupLimit(groups, config.limit);
			// Update rows to match grouped content
			rows = groups.flatMap((g) => g.rows);
		} else {
			rows = rows.slice(0, config.limit);
		}
	}

	// 7. Compute summaries
	const computedSummaries = computeSummaries(rows, config.summaries);

	return {
		config,
		rows,
		groups,
		computedSummaries,
	};
}

// Cache parsed filter ASTs so the same expression string isn't re-parsed per note
const filterASTCache = new Map();

function getCachedAST(expression) {
	if (filterASTCache.has(expression)) return filterASTCache.get(expression);
	try {
		const ast = parseExpression(expression);
		filterASTCache.set(expression, ast);
		return ast;
	} catch {
		filterASTCache.set(expression, null);
		return null;
	}
}

/**
 * Apply a filter block (array or object with and/or/not) to rows.
 */
function applyFilterBlock(rows, filterBlock) {
	return rows.filter((note) => matchesFilter(note, filterBlock));
}

/**
 * Check if a note matches a filter block.
 * Supports: string expression, array (implicit AND), { and: [...] }, { or: [...] }, { not: [...] }
 */
function matchesFilter(note, filterBlock) {
	if (typeof filterBlock === "string") {
		const ast = getCachedAST(filterBlock);
		if (!ast) return false;
		try {
			return Boolean(evalExpr(ast, note, note.__formulas || {}));
		} catch {
			return false;
		}
	}

	if (Array.isArray(filterBlock)) {
		// Implicit AND
		return filterBlock.every((f) => matchesFilter(note, f));
	}

	if (typeof filterBlock === "object" && filterBlock !== null) {
		if (filterBlock.and) {
			return filterBlock.and.every((f) => matchesFilter(note, f));
		}
		if (filterBlock.or) {
			return filterBlock.or.some((f) => matchesFilter(note, f));
		}
		if (filterBlock.not) {
			const subFilters = Array.isArray(filterBlock.not)
				? filterBlock.not
				: [filterBlock.not];
			return !subFilters.some((f) => matchesFilter(note, f));
		}
	}

	return true;
}

/**
 * Get a sortable value for a property path from a note.
 */
function getSortValue(note, property) {
	if (property === "file.name") {
		const parts = (note.path || "").split("/");
		return parts[parts.length - 1].replace(/\.[^.]+$/, "");
	}
	if (property.startsWith("file.")) {
		const prop = property.slice(5);
		// Reuse the simple file property resolution
		switch (prop) {
			case "path":
				return note.path || "";
			case "folder": {
				const idx = (note.path || "").lastIndexOf("/");
				return idx === -1 ? "" : (note.path || "").substring(0, idx);
			}
			default:
				return getUserProperty(note.metadata, prop);
		}
	}
	if (property.startsWith("formula.")) {
		const formulaKey = property.slice(8);
		return note.__formulas ? note.__formulas[formulaKey] : undefined;
	}
	return getUserProperty(note.metadata, property);
}

/**
 * Apply sorting to rows based on view config.
 */
function applySorting(rows, config) {
	if (config.sort && Array.isArray(config.sort) && config.sort.length > 0) {
		return [...rows].sort((a, b) => {
			for (const sortDef of config.sort) {
				const prop = sortDef.property;
				const dir = (sortDef.direction || "ASC").toUpperCase() === "DESC" ? -1 : 1;
				const valA = getSortValue(a, prop);
				const valB = getSortValue(b, prop);
				const cmp = compareValues(valA, valB);
				if (cmp !== 0) return cmp * dir;
			}
			return 0;
		});
	}

	// Legacy order: sort by first column ASC
	if (config.order && Array.isArray(config.order) && config.order.length > 0) {
		const firstProp = config.order[0];
		return [...rows].sort((a, b) => {
			const valA = getSortValue(a, firstProp);
			const valB = getSortValue(b, firstProp);
			return compareValues(valA, valB);
		});
	}

	return rows;
}

/**
 * Compare two values for sorting.
 */
function compareValues(a, b) {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a === "string" && typeof b === "string") {
		return a.localeCompare(b);
	}
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

/**
 * Group rows by a property, optionally sorting groups.
 */
function applyGrouping(rows, groupByDef) {
	const prop = groupByDef.property;
	const direction = (groupByDef.direction || "ASC").toUpperCase();

	const groupMap = new Map();
	for (const row of rows) {
		const key = getSortValue(row, prop);
		const keyStr = key != null ? String(key) : "(empty)";
		if (!groupMap.has(keyStr)) {
			groupMap.set(keyStr, []);
		}
		groupMap.get(keyStr).push(row);
	}

	let groups = Array.from(groupMap.entries()).map(([key, groupRows]) => ({
		key,
		rows: groupRows,
	}));

	// Sort groups by key
	groups.sort((a, b) => {
		const cmp = compareValues(a.key, b.key);
		return direction === "DESC" ? -cmp : cmp;
	});

	return groups;
}

/**
 * Apply limit to grouped rows (total row count across groups).
 */
function applyGroupLimit(groups, limit) {
	let remaining = limit;
	const result = [];
	for (const group of groups) {
		if (remaining <= 0) break;
		if (group.rows.length <= remaining) {
			result.push(group);
			remaining -= group.rows.length;
		} else {
			result.push({ key: group.key, rows: group.rows.slice(0, remaining) });
			remaining = 0;
		}
	}
	return result;
}

/**
 * Compute summary values for the given rows.
 */
function computeSummaries(rows, summaryDefs) {
	if (!summaryDefs) return {};

	const result = {};
	for (const [prop, summaryType] of Object.entries(summaryDefs)) {
		const values = rows.map((r) => getSortValue(r, prop));
		result[prop] = computeSingleSummary(values, summaryType);
	}
	return result;
}

/**
 * Compute a single summary given an array of values and a summary type.
 */
function computeSingleSummary(values, summaryType) {
	const type = typeof summaryType === "string" ? summaryType : String(summaryType);

	switch (type) {
		case "Average": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			if (nums.length === 0) return null;
			return nums.reduce((a, b) => a + b, 0) / nums.length;
		}
		case "Sum": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			return nums.reduce((a, b) => a + b, 0);
		}
		case "Min": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			if (nums.length === 0) return null;
			return Math.min(...nums);
		}
		case "Max": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			if (nums.length === 0) return null;
			return Math.max(...nums);
		}
		case "Range": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			if (nums.length === 0) return null;
			return Math.max(...nums) - Math.min(...nums);
		}
		case "Median": {
			const nums = values
				.filter((v) => typeof v === "number" && !isNaN(v))
				.sort((a, b) => a - b);
			if (nums.length === 0) return null;
			const mid = Math.floor(nums.length / 2);
			return nums.length % 2 === 0
				? (nums[mid - 1] + nums[mid]) / 2
				: nums[mid];
		}
		case "Stddev": {
			const nums = values.filter((v) => typeof v === "number" && !isNaN(v));
			if (nums.length === 0) return null;
			const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
			const variance =
				nums.reduce((sum, v) => sum + (v - mean) ** 2, 0) / nums.length;
			return Math.sqrt(variance);
		}
		case "Earliest": {
			const dates = values.filter((v) => v instanceof Date);
			if (dates.length === 0) return null;
			return new Date(Math.min(...dates.map((d) => d.getTime())));
		}
		case "Latest": {
			const dates = values.filter((v) => v instanceof Date);
			if (dates.length === 0) return null;
			return new Date(Math.max(...dates.map((d) => d.getTime())));
		}
		case "Checked":
			return values.filter((v) => v === true).length;
		case "Unchecked":
			return values.filter((v) => v === false).length;
		case "Empty":
			return values.filter(
				(v) => v == null || v === "" || (Array.isArray(v) && v.length === 0),
			).length;
		case "Filled":
			return values.filter(
				(v) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
			).length;
		case "Unique":
			return new Set(values.filter((v) => v != null)).size;
		case "Count":
			return values.length;
		default:
			return null;
	}
}

module.exports = { executeBaseQuery };
