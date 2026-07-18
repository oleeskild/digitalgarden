/**
 * View renderers for bases query results.
 * Generates static HTML for table, cards, and list views.
 */

// --- Metadata helpers ---

/**
 * Get a user property from metadata. Checks "dg-note-properties"
 * (nested/safe) first, then falls back to top-level metadata.
 */
function getMetaValue(metadata, key) {
	if (!metadata) return undefined;
	const nested = metadata["dg-note-properties"];
	if (nested && key in nested) return nested[key];
	if (key in metadata) return metadata[key];
	return undefined;
}

/**
 * Get all user-visible property keys from metadata.
 */
function getMetaKeys(metadata) {
	if (!metadata) return [];
	const keys = new Set();
	const nested = metadata["dg-note-properties"];
	if (nested) {
		for (const key of Object.keys(nested)) keys.add(key);
	}
	for (const key of Object.keys(metadata)) {
		if (key !== "dg-note-properties") keys.add(key);
	}
	return Array.from(keys);
}

// URL-to-title lookup, populated by renderViews before rendering
let urlTitleMap = {};

// --- Date formatting ---

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

function isISODate(str) {
	return ISO_DATE_REGEX.test(str);
}

// --- Helper functions ---

/**
 * Escape HTML entities in a string.
 */
function escapeHtml(str) {
	if (str == null) return "";
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}

/**
 * Internal keys to skip during column auto-detection.
 */
const INTERNAL_KEY_PATTERN = /^(tags|dg-.*|__formulas)$/;

/**
 * Determine the list of columns for a view.
 * Uses config.order if available, otherwise auto-detects from row metadata.
 */
function getColumns(config, rows, properties) {
	if (config.order && Array.isArray(config.order) && config.order.length > 0) {
		return config.order;
	}

	// Auto-detect: collect all metadata keys from rows, skip internal keys
	const keySet = new Set();
	keySet.add("file.name");
	for (const row of rows) {
		for (const key of getMetaKeys(row.metadata)) {
			if (!INTERNAL_KEY_PATTERN.test(key)) {
				keySet.add(key);
			}
		}
	}
	return Array.from(keySet);
}

/**
 * Get display name for a column.
 */
function getDisplayName(column, properties) {
	if (properties && properties[column] && properties[column].displayName) {
		return properties[column].displayName;
	}

	if (column === "file.name") return "Name";

	// Strip prefixes: formula.x → x, file.folder → folder
	let name = column;
	if (name.startsWith("formula.")) name = name.slice(8);
	if (name.startsWith("file.")) name = name.slice(5);

	// Capitalize first letter
	return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Extract the file name from a row's path.
 */
function getFileName(row) {
	if (!row.path) return "";
	const parts = row.path.split("/");
	return parts[parts.length - 1].replace(/\.[^.]+$/, "");
}

/**
 * Get a cell value from a row for a given column.
 */
function getCellValue(row, column) {
	if (column === "file.name") {
		return getFileName(row);
	}
	if (column === "file.folder") {
		if (!row.path) return "";
		const lastSlash = row.path.lastIndexOf("/");
		return lastSlash === -1 ? "" : row.path.substring(0, lastSlash);
	}
	if (column === "file.path") {
		return row.path || "";
	}
	if (column === "file.ext") {
		if (!row.path) return "md";
		const dotIdx = row.path.lastIndexOf(".");
		return dotIdx === -1 ? "md" : row.path.substring(dotIdx + 1);
	}
	if (column === "file.links") {
		return row._links || [];
	}
	if (column === "file.backlinks") {
		return row._backlinks || [];
	}
	if (column === "file.tags") {
		return (row.metadata && row.metadata.tags) || [];
	}
	// Handle formula.* columns
	if (column.startsWith("formula.")) {
		const formulaKey = column.slice(8);
		if (row.__formulas && row.__formulas[formulaKey] !== undefined) {
			return row.__formulas[formulaKey];
		}
		return undefined;
	}
	// Check user properties (nested + fallback), then __formulas
	const metaVal = getMetaValue(row.metadata, column);
	if (metaVal !== undefined) {
		return metaVal;
	}
	if (row.__formulas && row.__formulas[column] !== undefined) {
		return row.__formulas[column];
	}
	return undefined;
}

/**
 * Format a cell value for display as HTML.
 */
function formatCellValue(value, column, row) {
	if (column === "file.name") {
		const name = getFileName(row);
		const url = row.url || "";
		return `<a href="${escapeHtml(url)}" class="internal-link">${escapeHtml(name)}</a>`;
	}

	if (value === true) {
		return '<input type="checkbox" checked disabled />';
	}
	if (value === false) {
		return '<input type="checkbox" disabled />';
	}

	if (Array.isArray(value)) {
		return value.map((item) => {
			if (typeof item === "string" && item.startsWith("/")) {
				// URL path — render as clickable internal link with title
				const title = urlTitleMap[item]
					|| urlTitleMap[item.replace(/\/$/, "") + "/"]
					|| null;
				if (title) {
					return `<a href="${escapeHtml(item)}" class="internal-link">${escapeHtml(String(title))}</a>`;
				}
				// Unresolved link — render as dead link
				const slug = item.replace(/^\/|\/$/g, "").split("/").pop() || item;
				return `<a href="/404" class="internal-link is-unresolved">${escapeHtml(decodeURIComponent(slug))}</a>`;
			}
			if (typeof item === "string" && !item.startsWith("/") && item.includes("/")) {
				// Non-URL path with slashes (e.g. raw wikilink stem like "04 - PERMANENT/Note Name") — dead link
				const slug = item.split("/").pop().replace(/\.md$/, "") || item;
				return `<a href="/404" class="internal-link is-unresolved">${escapeHtml(slug)}</a>`;
			}
			return escapeHtml(String(item));
		}).join(", ");
	}

	if (value == null) {
		return "";
	}

	// Render ISO dates using the same pattern as the existing site —
	// a <span class="human-date"> that Luxon formats client-side using
	// the user's configured TIMESTAMP_FORMAT setting.
	if (typeof value === "string" && isISODate(value)) {
		return `<span class="human-date" data-date="${escapeHtml(value)}"></span>`;
	}

	if (value instanceof Date && !isNaN(value.getTime())) {
		// today() and now() should be evaluated client-side, not at build time
		if (value._basesType === "today") {
			return '<span class="bases-dynamic-date" data-type="today"></span>';
		}
		if (value._basesType === "now") {
			return '<span class="bases-dynamic-date" data-type="now"></span>';
		}
		return `<span class="human-date" data-date="${escapeHtml(value.toISOString())}"></span>`;
	}

	return escapeHtml(String(value));
}

/**
 * Build a group header block for cards/list grouped views.
 */
function buildGroupHeader(group) {
	return `<div class="obsidian-base-group-header-block"><span class="obsidian-base-group-label">${escapeHtml(String(group.key || "—"))}</span> <span class="obsidian-base-group-count">${group.rows.length}</span></div>`;
}

// --- View renderers ---

/**
 * Render a table view for the given rows.
 */
function renderTable(view, properties) {
	const { config, rows, groups, computedSummaries } = view;
	const columns = getColumns(config, rows, properties);

	if (rows.length === 0 && (!groups || groups.length === 0)) {
		return '<div class="obsidian-base-table-wrapper"><p class="obsidian-base-empty">No results</p></div>';
	}

	if (groups) {
		let html = '<div class="obsidian-base-table-wrapper">';
		html += '<table class="obsidian-base-table"><thead><tr>';
		for (const col of columns) {
			html += `<th>${escapeHtml(getDisplayName(col, properties))}</th>`;
		}
		html += "</tr></thead><tbody>";
		for (const group of groups) {
			// Group header row spanning all columns
			html += `<tr class="obsidian-base-group-row"><td colspan="${columns.length}"><span class="obsidian-base-group-label">${escapeHtml(String(group.key || "—"))}</span> <span class="obsidian-base-group-count">${group.rows.length}</span></td></tr>`;
			for (const row of group.rows) {
				html += "<tr>";
				for (const col of columns) {
					const value = getCellValue(row, col);
					html += `<td>${formatCellValue(value, col, row)}</td>`;
				}
				html += "</tr>";
			}
		}
		html += "</tbody></table>";
		html += buildSummaryBar(columns, computedSummaries, config.summaries);
		html += "</div>";
		return html;
	}

	let html = '<div class="obsidian-base-table-wrapper">';
	html += buildTable(columns, rows, properties);
	html += buildSummaryBar(columns, computedSummaries, config.summaries);
	html += "</div>";
	return html;
}

function buildTable(columns, rows, properties) {
	let html = '<table class="obsidian-base-table"><thead><tr>';
	for (const col of columns) {
		html += `<th>${escapeHtml(getDisplayName(col, properties))}</th>`;
	}
	html += "</tr></thead><tbody>";

	for (const row of rows) {
		html += "<tr>";
		for (const col of columns) {
			const value = getCellValue(row, col);
			html += `<td>${formatCellValue(value, col, row)}</td>`;
		}
		html += "</tr>";
	}
	html += "</tbody></table>";
	return html;
}

/**
 * Build a summary bar that sits outside and below the table.
 */
function buildSummaryBar(columns, computedSummaries, summaryConfig) {
	if (!computedSummaries || Object.keys(computedSummaries).length === 0) {
		return "";
	}

	let html = '<div class="obsidian-base-summary-bar">';
	for (const col of columns) {
		if (computedSummaries[col] !== undefined) {
			const label = (summaryConfig && summaryConfig[col]) || "";
			const displayName = getDisplayName(col);
			html += `<div class="obsidian-base-summary-item"><span class="obsidian-base-summary-col">${escapeHtml(displayName)}</span> <span class="obsidian-base-summary-label">${escapeHtml(String(label))}</span> <span class="obsidian-base-summary-value">${escapeHtml(String(computedSummaries[col]))}</span></div>`;
		}
	}
	html += "</div>";
	return html;
}

/**
 * Render a cards view.
 */
function renderCards(view, properties) {
	const { config, rows, groups } = view;
	const columns = getColumns(config, rows, properties);
	const cardSize = config.cardSize || 200;
	const imageFit = config.imageFit || "cover";
	const imageAspectRatio = config.imageAspectRatio || 1.5;
	const imageField = config.image || null;

	if (rows.length === 0 && (!groups || groups.length === 0)) {
		return '<p class="obsidian-base-empty">No results</p>';
	}

	if (groups) {
		let html = "";
		for (const group of groups) {
			html += buildGroupHeader(group);
			html += buildCardsGrid(group.rows, columns, cardSize, imageField, imageFit, imageAspectRatio, properties);
		}
		return html;
	}

	return buildCardsGrid(rows, columns, cardSize, imageField, imageFit, imageAspectRatio, properties);
}

function buildCardsGrid(rows, columns, cardSize, imageField, imageFit, imageAspectRatio, properties) {
	let html = `<div class="obsidian-base-cards" style="grid-template-columns: repeat(auto-fill, minmax(${cardSize}px, 1fr));">`;

	for (const row of rows) {
		html += '<div class="obsidian-base-card">';

		// Image section
		if (imageField) {
			let imgValue = getCellValue(row, imageField);
			if (imgValue) {
				imgValue = String(imgValue);
				// Resolve vault image paths to published URLs
				if (!imgValue.startsWith("http") && !imgValue.startsWith("/")) {
					imgValue = "/img/user/" + imgValue;
				}
				html += `<div class="obsidian-base-card-image"><img src="${escapeHtml(imgValue)}" style="object-fit: ${escapeHtml(imageFit)}; aspect-ratio: ${escapeHtml(String(imageAspectRatio))};" loading="lazy" /></div>`;
			}
		}

		// Content section
		html += '<div class="obsidian-base-card-content">';
		// Title
		const name = getFileName(row);
		const url = row.url || "";
		html += `<div class="obsidian-base-card-title"><a href="${escapeHtml(url)}" class="internal-link">${escapeHtml(name)}</a></div>`;

		// Other fields (skip file.name and image field)
		for (const col of columns) {
			if (col === "file.name" || col === imageField) continue;
			const value = getCellValue(row, col);
			if (value == null) continue;
			const displayName = getDisplayName(col, properties);
			html += `<div class="obsidian-base-card-field"><span class="obsidian-base-card-label">${escapeHtml(displayName)}</span>: <span class="obsidian-base-card-value">${formatCellValue(value, col, row)}</span></div>`;
		}

		html += "</div></div>";
	}

	html += "</div>";
	return html;
}

/**
 * Render a list view.
 */
function renderList(view, properties) {
	const { config, rows, groups } = view;
	const columns = getColumns(config, rows, properties);

	if (rows.length === 0 && (!groups || groups.length === 0)) {
		return '<p class="obsidian-base-empty">No results</p>';
	}

	if (groups) {
		let html = "";
		for (const group of groups) {
			html += buildGroupHeader(group);
			html += buildList(group.rows, columns, properties);
		}
		return html;
	}

	return buildList(rows, columns, properties);
}

function buildList(rows, columns, properties) {
	let html = '<ul class="obsidian-base-list">';
	for (const row of rows) {
		const parts = [];
		for (const col of columns) {
			parts.push(formatCellValue(getCellValue(row, col), col, row));
		}
		html += `<li>${parts.join(" — ")}</li>`;
	}
	html += "</ul>";
	return html;
}

// --- Main export ---

/**
 * SVG icon for a view type, matching Obsidian's UI.
 */
function viewTypeIcon(type) {
	switch (type) {
		case "table":
			return '<svg class="obsidian-bases-view-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>';
		case "cards":
			return '<svg class="obsidian-bases-view-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
		case "list":
			return '<svg class="obsidian-bases-view-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
		default:
			return '';
	}
}

/**
 * Render all views from a query result as HTML.
 * @param {object} queryResult - Output from executeBaseQuery
 * @returns {string} HTML string
 */
function renderViews(queryResult, allNotes) {
	const { properties, views } = queryResult;

	// Build URL-to-title map for resolving link display names
	urlTitleMap = {};
	if (allNotes) {
		for (const note of allNotes) {
			if (note.url) {
				const title = (note.metadata && (note.metadata.title ||
					(note.metadata["dg-note-properties"] && note.metadata["dg-note-properties"].title)))
					|| note.fileSlug || note.url;
				urlTitleMap[note.url] = title;
			}
		}
	}

	if (!views || views.length === 0) {
		return '<p class="obsidian-base-empty">No views defined</p>';
	}

	const renderedPanels = views.map((view) => {
		switch (view.config.type) {
			case "cards":
				return renderCards(view, properties);
			case "list":
				return renderList(view, properties);
			case "table":
			default:
				return renderTable(view, properties);
		}
	});

	// Single view — no dropdown, but show toolbar with name and count
	if (views.length === 1) {
		const view = views[0];
		const rowCount = view.rows ? view.rows.length : 0;
		let html = '<div class="obsidian-bases-views">';
		html += '<div class="obsidian-bases-toolbar">';
		html += `<span class="obsidian-bases-single-view-name">${viewTypeIcon(view.config.type)} ${escapeHtml(view.config.name)}</span>`;
		html += ` <span class="obsidian-bases-result-count">${rowCount} results</span>`;
		html += '</div>';
		html += renderedPanels[0];
		html += '</div>';
		return html;
	}

	// Multi-view with dropdown selector (matches Obsidian UI)
	const activeView = views[0];
	const rowCount = activeView.rows ? activeView.rows.length : 0;

	let html = '<div class="obsidian-bases-views">';

	// Toolbar with dropdown
	html += '<div class="obsidian-bases-toolbar">';
	html += '<div class="obsidian-bases-view-selector">';
	html += `<button class="obsidian-bases-active-view" aria-expanded="false">`;
	html += `${viewTypeIcon(activeView.config.type)} `;
	html += `<span class="obsidian-bases-active-view-name">${escapeHtml(activeView.config.name)}</span>`;
	html += ` <svg class="obsidian-bases-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
	html += `</button>`;

	// Dropdown menu
	html += '<div class="obsidian-bases-dropdown" style="display:none">';
	for (let i = 0; i < views.length; i++) {
		const activeClass = i === 0 ? " active" : "";
		html += `<button class="obsidian-bases-dropdown-item${activeClass}" data-view-index="${i}">`;
		html += `${viewTypeIcon(views[i].config.type)} `;
		html += `${escapeHtml(views[i].config.name)}`;
		html += `</button>`;
	}
	html += "</div></div>";

	// Result count
	html += ` <span class="obsidian-bases-result-count"><span class="obsidian-bases-count-value">${rowCount}</span> results</span>`;
	html += "</div>";

	// View panels
	for (let i = 0; i < renderedPanels.length; i++) {
		const hidden = i > 0 ? ' style="display:none"' : "";
		html += `<div class="obsidian-bases-view-panel" data-view-index="${i}"${hidden}>${renderedPanels[i]}</div>`;
	}

	html += "</div>";
	return html;
}

module.exports = {
	renderViews,
	// Export helpers for potential reuse
	escapeHtml,
	getColumns,
	getDisplayName,
	getCellValue,
	formatCellValue,
};
