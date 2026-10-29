import { splitAnchor, transformLink } from "@quartz-community/utils"
import type { FullSlug } from "@quartz-community/types"

import terrainColors from "../../../hexmap-terrain-colors.json"

export const TERRAIN_COLORS: Record<string, string> = terrainColors

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
