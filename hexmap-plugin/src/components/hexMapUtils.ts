import { splitAnchor, transformLink } from "@quartz-community/utils"
import type { FullSlug } from "@quartz-community/types"

export const TERRAIN_COLORS: Record<string, string> = {
  "deep-ocean": "#1e3a8a",
  ocean: "#2563eb",
  coast: "#93c5fd",
  river: "#38bdf8",
  lake: "#0ea5e9",
  grassland: "#4ade80",
  plains: "#86efac",
  forest: "#15803d",
  woodland: "#22c55e",
  jungle: "#166534",
  rainforest: "#14532d",
  hills: "#84cc16",
  mountain: "#64748b",
  snow: "#f1f5f9",
  tundra: "#cbd5e1",
  ice: "#bae6fd",
  desert: "#fde047",
  badlands: "#c2410c",
  savanna: "#d9a441",
  swamp: "#3f6212",
  marsh: "#65a30d",
  volcanic: "#57534e",
  lava: "#dc2626",
  farmland: "#a3e635",
  oasis: "#14b8a6",
  road: "#a8a29e",
  ruins: "#78716c",
  settlement: "#e879f9",
  default: "#e2e8f0",
}

export function offsetToPixel(q: number, r: number, size: number, orientation = "pointy") {
  if (orientation === "flat") {
    return {
      x: size * 1.5 * q,
      y: size * Math.sqrt(3) * (r + (Math.abs(q % 2) ? 0.5 : 0)),
    }
  }

  return {
    x: size * Math.sqrt(3) * (q + (Math.abs(r % 2) ? 0.5 : 0)),
    y: size * 1.5 * r,
  }
}

export function resolveHexLink(link: string, currentSlug: string, allSlugs: string[] = []): string {
  const trimmed = link.trim()
  const wikilink = trimmed.match(/^\[\[([\s\S]*?)\]\]$/)
  if (!wikilink) {
    const scheme = trimmed.match(/^([a-z][a-z\d+.-]*):/i)?.[1]
    return scheme && !/^(https?|mailto|tel)$/i.test(scheme) ? "" : trimmed
  }

  const target = wikilink[1].split("|")[0].trim().replace(/\\/g, "/")
  if (!target) return ""
  if (target.startsWith("#")) return splitAnchor(target)[1]
  return transformLink(currentSlug as FullSlug, target, {
    strategy: "shortest",
    allSlugs: allSlugs as FullSlug[],
  })
}
