// Remark plugin: transforms ==text== into <mark class="hl">text</mark>.

import { visit } from "unist-util-visit";

const HIGHLIGHT_RE = /==([^=]+)==/g;

export default function remarkHighlight() {
  return function transformer(tree) {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const value = node.value;
      if (!value || value.indexOf("==") < 0) return;

      const parts = [];
      let lastIndex = 0;
      HIGHLIGHT_RE.lastIndex = 0;
      let m;
      while ((m = HIGHLIGHT_RE.exec(value)) !== null) {
        const [whole, inner] = m;
        if (m.index > lastIndex) {
          parts.push({ type: "text", value: value.slice(lastIndex, m.index) });
        }
        parts.push({
          type: "emphasis",
          data: { hName: "mark", hProperties: { className: "hl" } },
          children: [{ type: "text", value: inner }],
        });
        lastIndex = m.index + whole.length;
      }
      if (lastIndex < value.length) {
        parts.push({ type: "text", value: value.slice(lastIndex) });
      }
      if (parts.length) parent.children.splice(index, 1, ...parts);
    });
  };
}
