import HexMap from "./HexMap"

export function parseHexMapFromMarkdown(content?: string | null): Record<string, unknown> | null {
  if (!content || typeof content !== "string") return null

  const trimmed = content.trim()
  if (!trimmed) return null

  try {
    const candidate = trimmed.startsWith("{") || trimmed.startsWith("[") ? trimmed : null
    if (candidate) {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>
    }
  } catch {
    // fall through to fenced JSON parsing below
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (!fencedMatch) return null

  try {
    const parsed = JSON.parse(fencedMatch[1].trim())
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>
  } catch {
    return null
  }

  return null
}

export function normalizeHexMapData(input: unknown): Record<string, any> | null {
  if (!input || typeof input !== "object") return null

  const candidate = input as Record<string, any>
  const settings = {
    width: 40,
    height: 30,
    hexSize: 30,
    orientation: "pointy",
    showGrid: true,
    showLabels: true,
    showCoordinates: false,
    fogEnabledByDefault: false,
    fogDistance: 2,
    viewMode: "hexcrawl",
    theme: "fantasy",
    ...candidate.settings,
  }

  const hexes = Array.isArray(candidate.hexes) ? candidate.hexes : []

  return {
    ...candidate,
    settings,
    hexes,
  }
}

type HexMapViewerProps = {
  fileData?: Record<string, any>
  allFiles?: Array<Record<string, any>>
  allSlugs?: string[]
}

const HexMapViewerComponent = ({ fileData, allFiles = [], allSlugs = [] }: HexMapViewerProps) => {
  const frontmatterMap =
    fileData?.frontmatter?.hexmap ??
    fileData?.frontmatter?.hexMap ??
    fileData?.hexmap ??
    fileData?.hexMap

  const markdownMap = parseHexMapFromMarkdown(
    typeof fileData?.content === "string"
      ? fileData.content
      : typeof fileData?.rawBody === "string"
        ? fileData.rawBody
        : null,
  )

  const mapData = normalizeHexMapData(frontmatterMap) ?? normalizeHexMapData(markdownMap)

  if (!mapData) return null

  return (
    <HexMap
      mapData={mapData}
      currentSlug={fileData?.slug ?? ""}
      allSlugs={
        allSlugs.length > 0
          ? allSlugs
          : allFiles
              .map((file) => file.slug)
              .filter((slug): slug is string => typeof slug === "string")
      }
    />
  )
}

export default function HexMapViewer() {
  return HexMapViewerComponent
}
