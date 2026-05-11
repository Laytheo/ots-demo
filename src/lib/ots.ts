import { getCollection, type CollectionEntry } from "astro:content";

export type RootType =
  | "person" | "place" | "work" | "event" | "idea" | "journal";

export const ROOT_TYPES: RootType[] = [
  "journal", "person", "place", "work", "event", "idea",
];

export const ROOT_COLOR: Record<RootType, string> = {
  person:  "#7A1F2B",
  place:   "#2D5238",
  work:    "#1F3A5F",
  event:   "#A67619",
  idea:    "#B8401F",
  journal: "#5B3A6B",
};

export const ROOT_LABEL: Record<RootType, string> = {
  person: "Person", place: "Place", work: "Work",
  event: "Event", idea: "Idea", journal: "Journal",
};

export interface IndexEntry {
  id: string;        // collection slug
  type: RootType;
  subtype?: string;
  title: string;
  href: string;
  color: string;
  data: Record<string, unknown>;
}

export type AnyEntry =
  | CollectionEntry<"person">
  | CollectionEntry<"place">
  | CollectionEntry<"work">
  | CollectionEntry<"event">
  | CollectionEntry<"idea">
  | CollectionEntry<"journal">;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripWikilinkBrackets(s: string): string {
  // "[[Foo]]" or "[[Foo|alias]]" -> "Foo"
  const m = s.match(/^\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*$/);
  if (m) return m[1].trim();
  return s.trim();
}

export interface IndexResult {
  index: Map<string, IndexEntry>;
  entries: IndexEntry[];
  byType: Record<RootType, IndexEntry[]>;
}

let _indexCache: Promise<IndexResult> | null = null;
export function getIndex(): Promise<IndexResult> {
  if (!_indexCache) _indexCache = buildIndex();
  return _indexCache;
}

let _graphCache: Promise<Graph> | null = null;
export function getGraph(): Promise<Graph> {
  if (!_graphCache) _graphCache = (async () => buildGraph({ idx: await getIndex() }))();
  return _graphCache;
}

export async function buildIndex(): Promise<IndexResult> {
  const all = await Promise.all(
    ROOT_TYPES.map(async (t) => {
      const c = await getCollection(t);
      return c.map((e) => toIndexEntry(t, e));
    })
  );
  const entries = all.flat();
  const index = new Map<string, IndexEntry>();
  for (const e of entries) {
    index.set(e.title.toLowerCase(), e);
    index.set(slugify(e.title), e);
    index.set(e.id.toLowerCase(), e);
  }
  const byType: Record<RootType, IndexEntry[]> = {
    person: [], place: [], work: [], event: [], idea: [], journal: [],
  };
  for (const e of entries) byType[e.type].push(e);
  for (const t of ROOT_TYPES) {
    byType[t].sort((a, b) => a.title.localeCompare(b.title));
  }
  return { index, entries, byType };
}

function toIndexEntry(type: RootType, e: AnyEntry): IndexEntry {
  const data = e.data as Record<string, unknown>;
  const subtype = data.subtype
    ? stripWikilinkBrackets(String(data.subtype))
    : undefined;
  return {
    id: e.id,
    type,
    subtype,
    title: String(data.title ?? e.id),
    href: e.id === type ? `/${type}` : `/${type}/${e.id}`,
    color: ROOT_COLOR[type],
    data,
  };
}

export function resolveWikilink(
  index: Map<string, IndexEntry>,
  raw: string
): IndexEntry | null {
  const inner = stripWikilinkBrackets(raw);
  return (
    index.get(inner.toLowerCase()) ||
    index.get(slugify(inner)) ||
    null
  );
}

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

const FRONTMATTER_LINK_FIELDS = [
  "associations",
  "creator", "creators",
  "key_people",
  "participants",
  "place",
  "spouses", "children", "parents",
  "parent_work",
  "subtype",
  "type",
];

function* iterFrontmatterLinks(data: Record<string, unknown>): Generator<string> {
  for (const f of FRONTMATTER_LINK_FIELDS) {
    const v = data[f];
    if (!v) continue;
    if (Array.isArray(v)) {
      for (const item of v) if (typeof item === "string") yield item;
    } else if (typeof v === "string") {
      yield v;
    }
  }
}

function* iterBodyLinks(body: string | undefined): Generator<string> {
  if (!body) return;
  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(body)) !== null) {
    const raw = m[1].split("|")[0].trim();
    yield raw;
  }
}

export interface GraphNode {
  id: string;
  title: string;
  type: RootType;
  subtype?: string;
  color: string;
  href: string;
}
export interface GraphEdge { source: string; target: string; }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; }

export async function buildGraph(opts: { idx?: IndexResult } = {}): Promise<Graph> {
  const idx = opts.idx ?? (await buildIndex());
  const collections = await Promise.all(
    ROOT_TYPES.map(async (t) => {
      const c = await getCollection(t);
      return c.map((e) => ({ type: t, entry: e as AnyEntry }));
    })
  );
  const flat = collections.flat();

  const nodes: GraphNode[] = idx.entries.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    subtype: e.subtype,
    color: e.color,
    href: e.href,
  }));

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];

  const addEdge = (src: string, tgt: string) => {
    if (src === tgt) return;
    const key = src < tgt ? `${src}|${tgt}` : `${tgt}|${src}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: src, target: tgt });
  };

  for (const { entry } of flat) {
    const data = entry.data as Record<string, unknown>;
    const body = (entry as { body?: string }).body;
    const sourceTitle = String(data.title ?? entry.id);
    const sourceEntry = idx.index.get(sourceTitle.toLowerCase());
    if (!sourceEntry) continue;

    const visit = (raw: string) => {
      const target = resolveWikilink(idx.index, raw);
      if (target) addEdge(sourceEntry.id, target.id);
    };
    for (const v of iterFrontmatterLinks(data)) visit(v);
    for (const v of iterBodyLinks(body)) visit(v);
  }

  return { nodes, edges };
}

export interface BacklinkMention {
  kind: "frontmatter" | "body" | "preview";
  field?: string;
  before?: string;
  after?: string;
  raw?: string;
  label?: string;
  text?: string;
}

export interface BacklinkSource {
  id: string;
  title: string;
  type: RootType;
  subtype?: string;
  href: string;
  color: string;
  mentions: BacklinkMention[];
}

const EXCERPT_RADIUS = 110;

let _backlinksCache: Promise<Map<string, BacklinkSource[]>> | null = null;
export function getBacklinks(): Promise<Map<string, BacklinkSource[]>> {
  if (!_backlinksCache) _backlinksCache = buildBacklinks();
  return _backlinksCache;
}

function stripIncidentalLinks(s: string): string {
  return s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t);
}

function bodyPreview(body: string, maxLen = 100): string {
  if (!body) return "";
  let s = body
    .replace(/^>\s*\[![^\]]*\][+-]?\s*[^\n]*/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a || t)
    .replace(/==([^=]+)==/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > maxLen) {
    s = s.slice(0, maxLen);
    const sp = s.lastIndexOf(" ");
    if (sp > 40) s = s.slice(0, sp);
    s += "…";
  }
  return s;
}

const SKIP_FRONTMATTER_FIELDS = new Set(["type", "subtype"]);

export async function buildBacklinks(): Promise<Map<string, BacklinkSource[]>> {
  const idx = await getIndex();
  const collections = await Promise.all(
    ROOT_TYPES.map(async (t) => {
      const c = await getCollection(t);
      return c.map((e) => ({ type: t, entry: e as AnyEntry }));
    })
  );
  const flat = collections.flat();

  const out = new Map<string, Map<string, BacklinkSource>>();
  const sourceBodies = new Map<string, string>();
  const ensureSource = (targetId: string, source: IndexEntry): BacklinkSource => {
    let by = out.get(targetId);
    if (!by) { by = new Map(); out.set(targetId, by); }
    let s = by.get(source.id);
    if (!s) {
      s = {
        id: source.id,
        title: source.title,
        type: source.type,
        subtype: source.subtype,
        href: source.href,
        color: source.color,
        mentions: [],
      };
      by.set(source.id, s);
    }
    return s;
  };
  const add = (targetId: string, source: IndexEntry, mention: BacklinkMention) => {
    ensureSource(targetId, source).mentions.push(mention);
  };

  for (const { entry } of flat) {
    const data = entry.data as Record<string, unknown>;
    const body = (entry as { body?: string }).body ?? "";
    const sourceTitle = String(data.title ?? entry.id);
    const source =
      idx.index.get(sourceTitle.toLowerCase()) ??
      idx.index.get(slugify(sourceTitle)) ??
      idx.index.get(entry.id.toLowerCase());
    if (!source) continue;
    sourceBodies.set(source.id, body);

    // Frontmatter links
    for (const f of FRONTMATTER_LINK_FIELDS) {
      const v = data[f];
      if (!v) continue;
      const items = Array.isArray(v) ? v : [v];
      for (const item of items) {
        if (typeof item !== "string") continue;
        const target = resolveWikilink(idx.index, item);
        if (!target || target.id === source.id) continue;
        if (SKIP_FRONTMATTER_FIELDS.has(f)) {
          ensureSource(target.id, source);
          continue;
        }
        const inner = stripWikilinkBrackets(item);
        const aliasMatch = item.match(/^\s*\[\[([^\]|]+)\|([^\]]+)\]\]\s*$/);
        const label = aliasMatch ? aliasMatch[2].trim() : inner;
        add(target.id, source, { kind: "frontmatter", field: f, raw: item, label });
      }
    }

    // Body links with excerpts
    if (body) {
      const re = /\[\[([^\]]+)\]\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body)) !== null) {
        const raw = m[0];
        const inner = m[1].split("|")[0].trim();
        const target = resolveWikilink(idx.index, raw);
        if (!target || target.id === source.id) continue;
        const start = m.index;
        const end = m.index + raw.length;
        const beforeStart = Math.max(0, start - EXCERPT_RADIUS);
        const afterEnd = Math.min(body.length, end + EXCERPT_RADIUS);
        let before = body.slice(beforeStart, start);
        let after = body.slice(end, afterEnd);
        if (beforeStart > 0) {
          const sp = before.search(/\s/);
          if (sp > -1) before = "…" + before.slice(sp);
        }
        if (afterEnd < body.length) {
          const sp = after.lastIndexOf(" ");
          if (sp > -1) after = after.slice(0, sp) + "…";
        }
        before = stripIncidentalLinks(before).replace(/\s+/g, " ");
        after = stripIncidentalLinks(after).replace(/\s+/g, " ");
        const aliasMatch = raw.match(/^\s*\[\[([^\]|]+)\|([^\]]+)\]\]\s*$/);
        const label = aliasMatch ? aliasMatch[2].trim() : inner;
        add(target.id, source, { kind: "body", before, after, raw, label });
      }
    }
  }

  const finalMap = new Map<string, BacklinkSource[]>();
  for (const [targetId, bySource] of out) {
    for (const s of bySource.values()) {
      if (s.mentions.length === 0) {
        const text = bodyPreview(sourceBodies.get(s.id) ?? "");
        if (text) s.mentions.push({ kind: "preview", text });
      }
    }
    const arr = Array.from(bySource.values())
      .filter((s) => s.mentions.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title));
    finalMap.set(targetId, arr);
  }
  return finalMap;
}

export function localGraph(
  graph: Graph,
  rootId: string,
  depth = 1
): Graph {
  const keep = new Set<string>([rootId]);
  let frontier = new Set<string>([rootId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const e of graph.edges) {
      if (frontier.has(e.source) && !keep.has(e.target)) {
        keep.add(e.target); next.add(e.target);
      } else if (frontier.has(e.target) && !keep.has(e.source)) {
        keep.add(e.source); next.add(e.source);
      }
    }
    frontier = next;
    if (!frontier.size) break;
  }
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    edges: graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
}
