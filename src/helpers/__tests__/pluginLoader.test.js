import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import {
	loadPlugins,
	applyMarkdownHooks,
	applyEleventyHooks,
	syncSlotTemplates,
	getNoteSettingKeys,
	getTemplateData,
} from "../pluginLoader.js";

const fixtureRoot = (name) =>
	path.relative(process.cwd(), path.join(__dirname, "..", "__fixtures__", name));

const BASIC = fixtureRoot("plugins-basic");
const BROKEN = fixtureRoot("plugins-broken");
const REGISTRY = fixtureRoot("plugins-registry");
const BAD_REGISTRY = fixtureRoot("plugins-badregistry");

const load = (root) => loadPlugins({ root, force: true });

let warnSpy;
beforeEach(() => {
	warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
	warnSpy.mockRestore();
	delete process.env.HELLO_GREETING;
	delete process.env.HELLO_FANCY;
	delete process.env.BETA_COLOR;
});

describe("loadPlugins", () => {
	it("loads valid plugins sorted by directory name", () => {
		const { plugins } = load(BASIC);
		expect(plugins.map((p) => p.id)).toEqual(["aaa-first", "hello"]);
	});

	it("returns an empty result when the plugins directory does not exist", () => {
		const { plugins, errors } = load(fixtureRoot("plugins-nonexistent"));
		expect(plugins).toEqual([]);
		expect(errors).toEqual([]);
	});

	it("skips broken plugins but keeps valid siblings, never throwing", () => {
		const { plugins, errors } = load(BROKEN);
		expect(plugins.map((p) => p.id)).toEqual(["good", "throwing"]);
		expect(errors.length).toBe(4); // badjson, noid, mismatch, unsafe
		expect(warnSpy).toHaveBeenCalled();
	});

	it("rejects unsafe paths", () => {
		const { plugins } = load(BROKEN);
		expect(plugins.find((p) => p.id === "unsafe")).toBeUndefined();
	});

	it("drops unknown slots and missing slot files but keeps the plugin", () => {
		const { plugins } = load(BASIC);
		const hello = plugins.find((p) => p.id === "hello");
		expect(Object.keys(hello.slots)).toEqual(["notes.footer"]);
		expect(hello.slots["notes.footer"]).toEqual(["templates/footer.njk"]);
	});

	it("caches results until force is passed", () => {
		const first = loadPlugins({ root: BASIC, force: true });
		const cached = loadPlugins({ root: BASIC });
		expect(cached).toBe(first);
		const forced = loadPlugins({ root: BASIC, force: true });
		expect(forced).not.toBe(first);
	});
});

describe("registry", () => {
	it("disables plugins via enabled:false and keeps the rest enabled", () => {
		const { plugins } = load(REGISTRY);
		expect(plugins.find((p) => p.id === "alpha").enabled).toBe(false);
		expect(plugins.find((p) => p.id === "beta").enabled).toBe(true);
	});

	it("treats a malformed plugins.json as absent", () => {
		const { plugins } = load(BAD_REGISTRY);
		expect(plugins.find((p) => p.id === "gamma").enabled).toBe(true);
		expect(warnSpy).toHaveBeenCalled();
	});
});

describe("settings resolution", () => {
	it("uses the manifest default when nothing else is set", () => {
		const { plugins } = load(BASIC);
		const hello = plugins.find((p) => p.id === "hello");
		expect(hello.settings).toEqual({ greeting: "hi", fancy: false });
	});

	it("prefers env vars over defaults, with boolean coercion", () => {
		process.env.HELLO_GREETING = "hola";
		process.env.HELLO_FANCY = "true";
		const { plugins } = load(BASIC);
		const hello = plugins.find((p) => p.id === "hello");
		expect(hello.settings).toEqual({ greeting: "hola", fancy: true });
	});

	it("prefers registry values over env vars", () => {
		process.env.BETA_COLOR = "green";
		const { plugins } = load(REGISTRY);
		expect(plugins.find((p) => p.id === "beta").settings.color).toBe("blue");
	});
});

describe("getNoteSettingKeys", () => {
	it("returns the union of enabled plugins' noteSettings", () => {
		expect(getNoteSettingKeys({ root: BASIC, force: true })).toEqual(["dgHello"]);
	});

	it("excludes disabled plugins", () => {
		expect(getNoteSettingKeys({ root: REGISTRY, force: true })).toEqual([]);
	});
});

describe("getTemplateData", () => {
	it("exposes ordered slot entries, style/script urls and settings", () => {
		const data = getTemplateData({ root: BASIC, force: true });
		expect(data.enabled).toEqual(["aaa-first", "hello"]);
		expect(data.slots["notes.footer"]).toEqual([
			{ file: "plugins/aaa-first/templates/first.njk", pluginId: "aaa-first" },
			{ file: "plugins/hello/templates/footer.njk", pluginId: "hello" },
		]);
		expect(data.styles).toEqual([
			"/plugins/hello/styles/hello.css",
			"/plugins/hello/styles/plain.css",
		]);
		expect(data.scripts).toEqual(["/plugins/hello/assets/client.js"]);
		expect(data.settings.hello).toEqual({ greeting: "hi", fancy: false });
	});

	it("omits disabled plugins entirely", () => {
		const data = getTemplateData({ root: REGISTRY, force: true });
		expect(data.enabled).toEqual(["beta"]);
		expect(data.settings.alpha).toBeUndefined();
	});
});

describe("regions", () => {
	const REGIONS = fixtureRoot("plugins-regions");

	it("assigns a region to the first enabled plugin and warns on conflict", () => {
		const data = getTemplateData({ root: REGIONS, force: true });

		expect(data.regions.navigation).toEqual({
			file: "plugins/nav-a/templates/nav.njk",
			pluginId: "nav-a",
		});

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('region "navigation" is already provided'),
		);
	});

	it("drops unknown region names but keeps the plugin", () => {
		const { plugins } = load(REGIONS);
		const navA = plugins.find((p) => p.id === "nav-a");
		expect(Object.keys(navA.regions)).toEqual(["navigation"]);
	});

	it("leaves a region unclaimed when its provider is disabled", () => {
		const disabledRoot = fixtureRoot("plugins-regions");
		const fs = require("fs");
		const registryFile = path.join(disabledRoot, "plugins.json");

		fs.writeFileSync(
			registryFile,
			JSON.stringify({
				version: 1,
				plugins: { "nav-a": { enabled: false } },
			}),
		);

		try {
			const data = getTemplateData({ root: disabledRoot, force: true });

			expect(data.regions.navigation.pluginId).toBe("nav-b");
		} finally {
			fs.rmSync(registryFile);
		}
	});

	it("syncs region templates alongside slot templates", () => {
		const fs = require("fs");
		const os = require("os");

		const includesRoot = fs.mkdtempSync(
			path.join(os.tmpdir(), "dg-includes-"),
		);

		try {
			syncSlotTemplates({ root: REGIONS, includesRoot });

			expect(
				fs.existsSync(path.join(includesRoot, "nav-a", "templates", "nav.njk")),
			).toBe(true);
		} finally {
			fs.rmSync(includesRoot, { recursive: true, force: true });
		}
	});
});

describe("syncSlotTemplates", () => {
	it("copies slot templates for enabled plugins and removes orphans", () => {
		const includesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dg-includes-"));
		try {
			const orphan = path.join(includesRoot, "gone-plugin", "old.njk");
			fs.mkdirSync(path.dirname(orphan), { recursive: true });
			fs.writeFileSync(orphan, "stale");

			syncSlotTemplates({ root: BASIC, includesRoot });

			expect(
				fs.readFileSync(
					path.join(includesRoot, "hello", "templates", "footer.njk"),
					"utf8"
				)
			).toContain("hello-footer");
			expect(
				fs.existsSync(path.join(includesRoot, "aaa-first", "templates", "first.njk"))
			).toBe(true);
			expect(fs.existsSync(orphan)).toBe(false);
		} finally {
			fs.rmSync(includesRoot, { recursive: true, force: true });
		}
	});

	it("does not rewrite files whose content is unchanged", () => {
		const includesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dg-includes-"));
		try {
			syncSlotTemplates({ root: BASIC, includesRoot });
			const target = path.join(includesRoot, "hello", "templates", "footer.njk");
			fs.utimesSync(target, new Date(0), new Date(0));
			syncSlotTemplates({ root: BASIC, includesRoot });
			expect(fs.statSync(target).mtimeMs).toBe(0);
		} finally {
			fs.rmSync(includesRoot, { recursive: true, force: true });
		}
	});
});

describe("hooks", () => {
	it("calls setupMarkdown with the plugin context", () => {
		const md = {};
		applyMarkdownHooks(md, { root: BASIC, force: true });
		expect(md.__helloMarkdown).toBe("hi");
	});

	it("survives hooks that throw", () => {
		const md = {};
		expect(() => applyMarkdownHooks(md, { root: BROKEN, force: true })).not.toThrow();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("boom markdown"));
	});

	it("registers watch target, passthroughs and eleventy hooks", () => {
		const eleventyConfig = {
			addWatchTarget: vi.fn(),
			on: vi.fn(),
			addPassthroughCopy: vi.fn(),
			addFilter: vi.fn(),
		};
		applyEleventyHooks(eleventyConfig, { root: BASIC, force: true });
		expect(eleventyConfig.addWatchTarget).toHaveBeenCalledWith(`./${BASIC}/`);
		expect(eleventyConfig.addPassthroughCopy).toHaveBeenCalledWith({
			[`${BASIC}/hello/styles/plain.css`]: "plugins/hello/styles/plain.css",
		});
		expect(eleventyConfig.addPassthroughCopy).toHaveBeenCalledWith({
			[`${BASIC}/hello/assets/client.js`]: "plugins/hello/assets/client.js",
		});
		expect(eleventyConfig.addFilter).toHaveBeenCalledWith("helloFilter", expect.any(Function));
	});

	it("survives setupEleventy hooks that throw", () => {
		const eleventyConfig = {
			addWatchTarget: vi.fn(),
			on: vi.fn(),
			addPassthroughCopy: vi.fn(),
			addFilter: vi.fn(),
		};
		expect(() =>
			applyEleventyHooks(eleventyConfig, { root: BROKEN, force: true })
		).not.toThrow();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("boom eleventy"));
	});
});
