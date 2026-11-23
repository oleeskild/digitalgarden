const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const lucideIcons = require("lucide");

const DEFAULT_CALLOUT_ICONS = [
  "pencil", "clipboard-list", "info", "check-circle-2", "flame",
  "check", "help-circle", "alert-triangle", "x", "zap",
  "bug", "list", "quote", "chevron-down", "chevron-right"
];

function toPascalCase(kebab) {
  return kebab
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, (chr) => chr.toUpperCase());
}

function collectFiles(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, extensions, results);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

async function bundleUsedLucideIcons(outputDir) {
  const iconNames = new Set(DEFAULT_CALLOUT_ICONS);
  const lucideRegex = /(?:data-lucide|icon-name)\s*=\s*["']([a-z0-9-]+)["']/gi;

  const filesToScan = [
    ...collectFiles(process.cwd(), [".njk", ".html"]),
    ...collectFiles(outputDir, [".html"]),
  ];

  for (const file of new Set(filesToScan)) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = lucideRegex.exec(content)) !== null) {
      iconNames.add(match[1].toLowerCase());
    }
  }

  const validExports = [];
  for (const name of iconNames) {
    const pascal = toPascalCase(name);
    if (lucideIcons[pascal]) {
      validExports.push(pascal);
    }
  }

  const entrySource = `
    import { createIcons, ${validExports.join(", ")} } from "lucide";
    const icons = { ${validExports.join(", ")} };
    window.lucide = {
      createIcons: (opts = {}) => createIcons({ ...opts, icons })
    };
  `;

  await esbuild.build({
    stdin: {
      contents: entrySource,
      resolveDir: process.cwd(),
      loader: "js",
    },
    bundle: true,
    minify: true,
    outfile: path.join(outputDir, "lucide-custom.js"),
  });

  console.log(`[lucide] Bundled ${validExports.length} used icons into lucide-custom.js`);
}

module.exports = { bundleUsedLucideIcons };
