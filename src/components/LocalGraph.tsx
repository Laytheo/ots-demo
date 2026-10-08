import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { Graph, GraphNode, RootType } from "../lib/ots";
import { useThemeColors } from "../lib/useThemeColors";

interface Props {
  graph: Graph;
  settled?: boolean;
  rootId?: string;
  height?: number;
}

export default function LocalGraph({ graph, rootId, height = 280, settled = false }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);
  const [width, setWidth] = useState<number>(320);
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

  const data = useMemo(() => ({
    // Reserve label space for the root before its neighbors.
    nodes: graph.nodes.map((n) => ({ ...n })).sort((a, b) =>
      Number(b.id === rootId) - Number(a.id === rootId)),
    links: graph.edges.map((e) => ({ source: e.source, target: e.target })),
  }), [graph, rootId]);

  const labelBoxes: { x: number; y: number; width: number; height: number }[] = [];

  return (
    <div ref={wrapRef} style={{ width: "100%", height }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={width}
        height={height}
        backgroundColor={colors.bg}
        nodeRelSize={4}
        nodeColor={(n: any) => (n.id === rootId ? colors.ink : colors.root[n.type as RootType])}
        nodeLabel={(n: any) => `${n.title} · ${n.type}`}
        linkColor={() => colors.link}
        linkWidth={1}
        cooldownTicks={settled ? 0 : 80}
        {...(settled ? { warmupTicks: 80 } : {})}
        d3VelocityDecay={0.3}
        onEngineStop={() => fgRef.current?.zoomToFit(0, 24)}
        onRenderFramePre={() => { labelBoxes.length = 0; }}
        onNodeClick={(n: any) => {
          if (n.href) window.location.assign(n.href);
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (globalScale < 1.5 && n.id !== rootId) return;
          const fg = fgRef.current;
          if (!fg) return;
          let label = n.title;
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px "Newsreader", Georgia, serif`;
          const maxWidth = Math.min(100, width - 16);
          if (ctx.measureText(label).width * globalScale > maxWidth) {
            while (label.length && ctx.measureText(label + "…").width * globalScale > maxWidth) {
              label = label.slice(0, -1);
            }
            label += "…";
          }
          const labelWidth = ctx.measureText(label).width * globalScale;
          const point = fg.graph2ScreenCoords(n.x, n.y);
          const offset = 4 * globalScale + 6;
          // Try either side and above/below; clamp in screen pixels at every zoom.
          const candidates = [
            [point.x + offset, point.y],
            [point.x - labelWidth - offset, point.y],
            [point.x - labelWidth / 2, point.y + offset + 7],
            [point.x - labelWidth / 2, point.y - offset - 7],
          ];
          const box = candidates.map(([x, y]) => ({
            x: Math.max(8, Math.min(width - labelWidth - 8, x)),
            y: Math.max(8, Math.min(height - 22, y - 7)),
            width: labelWidth,
            height: 14,
          })).find((b) => !data.nodes.some((node: any) => {
            const p = fg.graph2ScreenCoords(node.x, node.y);
            const radius = 4 * globalScale + 2;
            return p.x + radius > b.x && p.x - radius < b.x + b.width &&
              p.y + radius > b.y && p.y - radius < b.y + b.height;
          }) && !labelBoxes.some((other) =>
            b.x < other.x + other.width + 4 && b.x + b.width + 4 > other.x &&
            b.y < other.y + other.height + 2 && b.y + b.height + 2 > other.y));
          // Dense regions can reveal omitted labels through the existing node tooltip.
          if (!box) return;
          labelBoxes.push(box);
          const position = fg.screen2GraphCoords(box.x, box.y + 7);
          ctx.fillStyle = colors.inkSoft;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, position.x, position.y);
        }}
      />
    </div>
  );
}
