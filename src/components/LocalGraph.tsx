import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { Graph, GraphNode } from "../lib/ots";

interface Props {
  graph: Graph;
  rootId?: string;
  height?: number;
}

export default function LocalGraph({ graph, rootId, height = 280 }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods<GraphNode> | undefined>(undefined);
  const [width, setWidth] = useState<number>(320);

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
    nodes: graph.nodes.map((n) => ({ ...n })),
    links: graph.edges.map((e) => ({ source: e.source, target: e.target })),
  }), [graph]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={width}
        height={height}
        backgroundColor="#FBF8F1"
        nodeRelSize={4}
        nodeColor={(n: any) => (n.id === rootId ? "#1A1612" : n.color)}
        nodeLabel={(n: any) => `${n.title} · ${n.type}`}
        linkColor={() => "rgba(60, 50, 40, 0.25)"}
        linkWidth={1}
        cooldownTicks={80}
        d3VelocityDecay={0.3}
        onNodeClick={(n: any) => {
          if (n.href) window.location.assign(n.href);
        }}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (globalScale < 1.5 && n.id !== rootId) return;
          const label = n.title;
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px "Newsreader", Georgia, serif`;
          ctx.fillStyle = "#3D352B";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, n.x + 6, n.y);
        }}
      />
    </div>
  );
}
