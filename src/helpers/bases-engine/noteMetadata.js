/**
 * Filter a note's Eleventy data down to what the bases engine should see
 * as note metadata. The full data cascade contains build internals
 * (collections, pkg, the basesNotes array itself, ...) which leaked into
 * auto-detected columns and made views without an `order` block unusable.
 *
 * A blacklist (rather than a whitelist) keeps legacy top-level user
 * properties working for notes published before the plugin nested them
 * under "dg-note-properties".
 */

const CASCADE_KEYS = new Set([
	// Eleventy internals
	"pkg",
	"layout",
	"permalink",
	"page",
	"collections",
	"eleventyComputed",
	"eleventyNavigation",
	"content",
	"templateContent",
	// Global data files and computed data from this template
	"basesNotes",
	"settings",
	"graph",
	"filetree",
	"userComputed",
	"noteProps",
	"dynamics",
	"meta",
	"plugins",
]);

function pickNoteMetadata(data) {
	if (!data || typeof data !== "object") return {};

	const picked = {};
	for (const [key, value] of Object.entries(data)) {
		if (CASCADE_KEYS.has(key)) continue;
		picked[key] = value;
	}
	return picked;
}

module.exports = { pickNoteMetadata };
