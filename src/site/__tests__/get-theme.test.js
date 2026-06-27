import { execFile } from "child_process";
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getThemeScript = path.resolve(__dirname, "../get-theme.js");

function runGetTheme(cwd, themeUrl) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [getThemeScript],
      {
        cwd,
        env: {
          ...process.env,
          THEME: themeUrl,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
          return;
        }
        resolve();
      },
    );
  });
}

function createThemeServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/theme.css") {
      res.writeHead(404, { "Content-Type": "text/css" });
      res.end("missing theme css");
      return;
    }

    if (req.url === "/obsidian.css") {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end("/* theme metadata */\nbody { color: rebeccapurple; }");
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

describe("get-theme", () => {
  it("falls back to obsidian.css when theme.css returns 404", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dg-theme-"));
    const stylesDir = path.join(tmpDir, "src/site/styles");
    fs.mkdirSync(stylesDir, { recursive: true });
    const server = await createThemeServer();

    try {
      await runGetTheme(tmpDir, `${server.url}/theme.css`);

      const themeFiles = fs.readdirSync(stylesDir).filter((file) => file.startsWith("_theme."));
      expect(themeFiles).toHaveLength(1);
      const themeCss = fs.readFileSync(path.join(stylesDir, themeFiles[0]), "utf8");
      expect(themeCss).toContain("body { color: rebeccapurple; }");
      expect(themeCss).not.toContain("missing theme css");
    } finally {
      await server.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
