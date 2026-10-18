// Post-build gate (perceived-latency rule): no page may make the visitor's browser fetch
// anything from another origin. Links (<a href>) to other sites are fine; resources are not.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// BUILD_DIR lets the gate be exercised against a copy of the output.
const DIST = process.env.BUILD_DIR
  ? process.env.BUILD_DIR.replace(/\/?$/, "/")
  : new URL("../dist/", import.meta.url).pathname;
const EXT = String.raw`["']?(https?:)?\/\/`;
const RESOURCE = [
  new RegExp(String.raw`<script[^>]+src=${EXT}`, "gi"),
  // Any <link> pointing off-site loads or warms something (stylesheet, icon, preconnect, manifest…).
  new RegExp(String.raw`<link(?![^>]*rel=["']?(canonical|alternate)\b)[^>]+href=${EXT}`, "gi"),
  new RegExp(String.raw`<(img|iframe|source|video|audio|track|embed)[^>]+(src|srcset|poster)=${EXT}`, "gi"),
  new RegExp(String.raw`<object[^>]+data=${EXT}`, "gi"),
  new RegExp(String.raw`url\(\s*${EXT}`, "gi"),
  new RegExp(String.raw`@import\s+(url\()?${EXT}`, "gi"),
  new RegExp(String.raw`\b(fetch|import|importScripts|sendBeacon)\(\s*["'\x60](https?:)?\/\/`, "gi"),
  /new\s+(WebSocket|EventSource)\(/gi,
];
const MAX_PAGE_BYTES = 200 * 1024;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

const problems = [];
let pages = 0;
for (const path of files(DIST)) {
  if (!/\.(html|css|js)$/.test(path)) continue;
  const text = readFileSync(path, "utf8");
  for (const re of RESOURCE) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) problems.push(`${path.slice(DIST.length)}: external resource near "${text.slice(m.index, m.index + 90)}"`);
  }
  if (path.endsWith(".html")) {
    pages++;
    if (text.length > MAX_PAGE_BYTES) problems.push(`${path.slice(DIST.length)}: ${text.length} bytes > ${MAX_PAGE_BYTES}`);
  }
}

if (pages < 29) problems.push(`expected at least 29 pages (26 sheets + home + 2 info pages), found ${pages}`);
if (problems.length) {
  console.error("check-dist failed:\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`check-dist ok: ${pages} pages, no external resources`);
