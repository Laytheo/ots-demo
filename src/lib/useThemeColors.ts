import { useEffect, useState } from "react";
import type { RootType } from "./ots";

export interface ThemeColors {
  bg: string;
  border: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  inkFaded: string;
  link: string;
  root: Record<RootType, string>;
}

function read(): ThemeColors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    bg:       v("--color-parchment-50"),
    border:   v("--color-parchment-300"),
    ink:      v("--color-ink"),
    inkSoft:  v("--color-ink-soft"),
    inkMuted: v("--color-ink-muted"),
    inkFaded: v("--color-ink-faded"),
    link:     `color-mix(in oklab, ${v("--color-ink-soft")} 45%, transparent)`,
    root: {
      person:  v("--color-ots-person"),
      place:   v("--color-ots-place"),
      work:    v("--color-ots-work"),
      event:   v("--color-ots-event"),
      idea:    v("--color-ots-idea"),
      journal: v("--color-ots-journal"),
    },
  };
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return colors;
}
