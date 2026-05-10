import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { forceCollide } from "d3-force-3d";
import type { Graph, GraphNode, RootType } from "../lib/ots";
import { useThemeColors } from "../lib/useThemeColors";

interface Props {
  graph: Graph;
  height?: number;
}

const ROOTS: RootType[] = ["person", "place", "work", "event", "idea", "journal"];

const NODE_REL_SIZE = 5;
const TYPE_VAL = 2.5; // sqrt(2.5) ≈ 1.58x radius vs val=1
const isTypeNode = (n: { id: string; type: string }) => n.id === n.type;
const nodeRadius = (n: { val?: number }) => NODE_REL_SIZE * Math.sqrt(n.val ?? 1);

export default function GlobalGraph({ graph, height = 600 }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);
  const [width, setWidth] = useState<number>(800);
  const [enabled, setEnabled] = useState<Set<RootType>>(new Set(ROOTS));
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      if (wrapRef.current) setWidth(wrapRef.current.clientWidth);
    });
    ro.observe(wrapRef.current);
    setWidth(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force("charge") as { strength: (s: number) => unknown } | undefined;
    const link = fg.d3Force("link") as { distance: (d: number) => unknown } | undefined;
    charge?.strength(-180);
    link?.distance(60);
    fg.d3Force("collide", forceCollide((n: any) => nodeRadius(n) + 4));
    fg.d3ReheatSimulation();
  }, []);

  const data = useMemo(() => {
    const visibleIds = new Set(graph.nodes.filter((n) => enabled.has(n.type)).map((n) => n.id));
    return {
      nodes: graph.nodes
        .filter((n) => visibleIds.has(n.id))
        .map((n) => ({ ...n, val: isTypeNode(n) ? TYPE_VAL : 1 })),
      links: graph.edges
        .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
        .map((e) => ({ source: e.source, target: e.target })),
    };
  }, [graph, enabled]);

  const toggle = (t: RootType) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  return (
    <div>
      <div
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.inkMuted,
          marginBottom: "0.5rem",
        }}
      >
        Filter by type
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ROOTS.map((t) => {
          const on = enabled.has(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className="px-3 py-1 rounded-full text-xs uppercase tracking-widest border transition"
              style={{
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                borderColor: on ? colors.root[t] : colors.border,
                color: on ? colors.root[t] : colors.inkFaded,
                background: on ? `color-mix(in oklab, ${colors.bg} 60%, transparent)` : "transparent",
              }}
            >
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: 9999,
                background: colors.root[t], marginRight: 6, verticalAlign: "middle",
                opacity: on ? 1 : 0.4,
              }} />
              {t}
            </button>
          );
        })}
      </div>

      <div ref={wrapRef} style={{ width: "100%", height, position: "relative", border: `1px solid ${colors.border}`, background: colors.bg, borderRadius: 2 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={width}
          height={height}
          backgroundColor={colors.bg}
          nodeRelSize={5}
          nodeColor={(n: any) => colors.root[n.type as RootType]}
          nodeLabel={(n: any) => `${n.title} · ${n.type}`}
          linkColor={() => colors.link}
          linkWidth={1}
          cooldownTicks={120}
          d3VelocityDecay={0.25}
          onNodeHover={(n: any) => setHovered(n ?? null)}
          onNodeClick={(n: any) => { if (n.href) window.location.assign(n.href); }}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const typeNode = isTypeNode(n);
            if (!typeNode && globalScale < 1.4) return;
            const fontSize = (typeNode ? 14 : 11) / globalScale;
            const weight = typeNode ? "600" : "400";
            ctx.font = `${weight} ${fontSize}px "Newsreader", Georgia, serif`;
            ctx.fillStyle = typeNode ? colors.ink : colors.inkSoft;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(n.title, n.x + nodeRadius(n) + 4, n.y);
          }}
        />
        {hovered && (
          <div
            style={{
              position: "absolute", bottom: 12, left: 12,
              background: colors.bg, border: `1px solid ${colors.border}`, padding: "0.5rem 0.75rem",
              fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.72rem",
              color: colors.inkSoft, maxWidth: 320, pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: colors.root[hovered.type] }} />
              <span style={{ textTransform: "uppercase", letterSpacing: "0.12em", color: colors.inkMuted }}>{hovered.type}{hovered.subtype ? ` · ${hovered.subtype}` : ""}</span>
            </div>
            <div style={{ marginTop: 4, fontFamily: "Newsreader, Georgia, serif", fontSize: "0.95rem", color: colors.ink }}>{hovered.title}</div>
          </div>
        )}
      </div>
    </div>
  );
}
