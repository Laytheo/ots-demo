// Remark plugin: resolves [[Wikilinks]] in markdown body to anchor nodes,
// using a synchronous title/slug index built from src/content/**/*.md frontmatter.

import fs from "node:fs";
import path from "node:path";
import { visit } from "unist-util-visit";

const CONTENT_DIR = path.resolve(process.cwd(), "src/content");
const ROOT_TYPES = ["person", "place", "work", "event", "idea", "journal"];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readFrontmatter(text) {
  // very small YAML frontmatter parser, enough for our shape
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const block = text.slice(3, end).trim();
  const out = {};
  let key = null;
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (m) {
      key = m[1];
      const v = m[2].trim();
      if (v === "" || v === "|" || v === ">") {
        out[key] = "";
      } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        out[key] = v.slice(1, -1);
      } else {
        out[key] = v;
      }
    }
  }
  return out;
}

function buildIndex() {
  const idx = new Map();
  for (const t of ROOT_TYPES) {
    const dir = path.join(CONTENT_DIR, t);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
      const slug = file.replace(/\.(md|mdx)$/, "");
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const fm = readFrontmatter(text);
      const title = fm?.title ?? slug;
      const entry = { type: t, slug, title, href: `/${t}/${slug}` };
      idx.set(title.toLowerCase(), entry);
      idx.set(slugify(title), entry);
      idx.set(slug.toLowerCase(), entry);
    }
  }
  return idx;
}

const ROOT_CLASS = {
  person: "wl-person", place: "wl-place", work: "wl-work",
  event: "wl-event", idea: "wl-idea", journal: "wl-journal",
};

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

export default function remarkWikilinks() {
  // Built once per process. Astro restarts dev server on file add, so this is fine.
  const idx = buildIndex();

  return function transformer(tree) {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const value = node.value;
      if (!value || value.indexOf("[[") < 0) return;

      const parts = [];
      let lastIndex = 0;
      WIKILINK_RE.lastIndex = 0;
      let m;
      while ((m = WIKILINK_RE.exec(value)) !== null) {
        const [whole, inner] = m;
        if (m.index > lastIndex) {
          parts.push({ type: "text", value: value.slice(lastIndex, m.index) });
        }
        const [target, alias] = inner.split("|").map((s) => s.trim());
        const label = (alias && alias.length) ? alias : target;
        const found = idx.get(target.toLowerCase()) || idx.get(slugify(target));
        if (found) {
          parts.push({
            type: "link",
            url: found.href,
            data: {
              hProperties: {
                className: `wikilink-resolved ${ROOT_CLASS[found.type]}`,
              },
            },
            children: [{ type: "text", value: label }],
          });
        } else {
          parts.push({
            type: "emphasis",
            data: {
              hName: "span",
              hProperties: { className: "wl-unresolved", title: "Not yet written" },
            },
            children: [{ type: "text", value: label }],
          });
        }
        lastIndex = m.index + whole.length;
      }
      if (lastIndex < value.length) {
        parts.push({ type: "text", value: value.slice(lastIndex) });
      }
      if (parts.length) parent.children.splice(index, 1, ...parts);
    });
  };
}
