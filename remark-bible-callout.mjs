// Remark plugin: transforms Obsidian-style Bible callouts into a structured
// <aside class="bible-callout"> with header and body wrappers. Must run before
// remark-wikilinks so wikilinks inside the callout body still resolve.
//
// Input shape:
//
//   > [!bible]+ Luke 24:12 - KJV [[Luke 24]]
//   > 12. Then arose Peter ... ==wondering== in himself ...
//
// Output (after subsequent plugins resolve wikilinks/highlights):
//
//   <aside class="bible-callout">
//     <div class="bc-header">
//       <span class="bc-citation">Luke 24:12</span>
//       <span class="bc-translation">KJV</span>
//       <span class="bc-chapter"><span class="wl-unresolved">Luke 24</span></span>
//     </div>
//     <div class="bc-body">
//       <sup class="bc-verse-num">12</sup>
//       Then arose Peter ... <mark class="hl">wondering</mark> in himself ...
//     </div>
//   </aside>

import { visit } from "unist-util-visit";

const HEADER_RE = /^\[!bible\][+-]?\s+(.+?)\s+-\s+([A-Z]+)(?:\s+(\[\[[^\]]+\]\]))?\s*$/;

function span(className, children) {
  return {
    type: "emphasis",
    data: { hName: "span", hProperties: { className } },
    children: typeof children === "string" ? [{ type: "text", value: children }] : children,
  };
}

function paraDiv(className, children) {
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { className } },
    children,
  };
}

export default function remarkBibleCallout() {
  return function transformer(tree) {
    visit(tree, "blockquote", (node) => {
      if (node.data?.hName === "aside") return;

      const firstPara = node.children[0];
      if (!firstPara || firstPara.type !== "paragraph") return;

      const firstText = firstPara.children[0];
      if (!firstText || firstText.type !== "text") return;

      const value = firstText.value;
      if (!value.startsWith("[!bible]")) return;

      const newlineIdx = value.indexOf("\n");
      const headerLine = newlineIdx >= 0 ? value.slice(0, newlineIdx) : value;
      const restOfFirstText = newlineIdx >= 0 ? value.slice(newlineIdx + 1) : "";

      const m = headerLine.match(HEADER_RE);
      if (!m) return;

      const [, citation, translation, chapterLink] = m;

      const headerChildren = [
        span("bc-citation", citation),
        { type: "text", value: " " },
        span("bc-translation", translation),
      ];
      if (chapterLink) {
        headerChildren.push({ type: "text", value: " " });
        headerChildren.push(span("bc-chapter", chapterLink));
      }

      const bodyChildren = [];
      const verseMatch = restOfFirstText.match(/^(\d+)\.\s+([\s\S]*)$/);
      let bodyTextStart = restOfFirstText;
      if (verseMatch) {
        bodyChildren.push({
          type: "emphasis",
          data: { hName: "sup", hProperties: { className: "bc-verse-num" } },
          children: [{ type: "text", value: verseMatch[1] }],
        });
        bodyChildren.push({ type: "text", value: " " });
        bodyTextStart = verseMatch[2];
      }
      if (bodyTextStart) {
        bodyChildren.push({ type: "text", value: bodyTextStart });
      }
      for (let i = 1; i < firstPara.children.length; i++) {
        bodyChildren.push(firstPara.children[i]);
      }

      const remainingParas = node.children.slice(1);

      node.data = { hName: "aside", hProperties: { className: "bible-callout" } };
      node.children = [
        paraDiv("bc-header", headerChildren),
        paraDiv("bc-body", bodyChildren),
        ...remainingParas,
      ];
    });
  };
}
