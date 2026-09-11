import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "module";

// Issue #416: on Windows, glob returns backslash-separated paths unless
// asked for posix output, which made meta.siteLogoPath "/undefined" and
// put backslashes into the theme stylesheet URL.
//
// meta.js is CommonJS and loads glob with a native require, so vi.mock
// can't intercept it. Swap the export in Node's require cache instead.

const require = createRequire(import.meta.url);
const globId = require.resolve("glob");
const metaId = require.resolve("../meta.js");

const windowsify = (p) => p.split("/").join("\\");

const fakeGlobSync = (pattern, opts = {}) => {
	let matches = [];
	if (pattern.startsWith("src/site/logo.")) {
		matches = ["src/site/logo.svg"];
	} else if (pattern.startsWith("src/site/styles/_theme.")) {
		matches = ["src/site/styles/_theme.abcd1234.css"];
	}
	return opts.posix ? matches : matches.map(windowsify);
};

let realGlobExports;
let meta;

beforeAll(async () => {
	require("glob"); // make sure the cache entry exists
	realGlobExports = require.cache[globId].exports;
	require.cache[globId].exports = { ...realGlobExports, globSync: fakeGlobSync };
	delete require.cache[metaId];
	meta = await require(metaId)({});
});

afterAll(() => {
	require.cache[globId].exports = realGlobExports;
	delete require.cache[metaId];
});

describe("meta.js on Windows-style glob output", () => {
	it("builds a forward-slash logo path", () => {
		expect(meta.siteLogoPath).toBe("/logo.svg");
	});

	it("builds a forward-slash theme stylesheet path", () => {
		expect(meta.themeStyle).toBe("/styles/_theme.abcd1234.css");
	});
});
