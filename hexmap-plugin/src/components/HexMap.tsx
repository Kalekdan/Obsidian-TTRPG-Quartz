import { offsetToPixel, resolveHexLink, TERRAIN_COLORS } from "./hexMapUtils"

function getHexPoints(centerX: number, centerY: number, size: number, orientation: string) {
  const points: string[] = []
  const angleOffset = orientation === "flat" ? 0 : -30
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i + angleOffset)
    const px = centerX + size * Math.cos(angleRad)
    const py = centerY + size * Math.sin(angleRad)
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`)
  }
  return points.join(" ")
}

export default function HexMap({
  mapData,
  onHexClick,
  currentSlug = "",
  allSlugs = [],
}: {
  mapData?: any
  onHexClick?: (hex: any) => void
  currentSlug?: string
  allSlugs?: string[]
}) {
  if (!mapData || !Array.isArray(mapData.hexes)) return null

  const { settings, hexes } = mapData
  const orientation = settings?.orientation === "flat" ? "flat" : "pointy"
  const hexSize = Number(settings?.hexSize) || 30

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  const calculatedHexes = hexes.map((hex: any) => {
    const { x, y } = offsetToPixel(Number(hex.q), Number(hex.r), hexSize, orientation)

    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y

    return { ...hex, x, y }
  })

  const padding = hexSize * 2
  const viewBoxWidth =
    (Number.isFinite(maxX) && Number.isFinite(minX) ? maxX - minX : hexSize * 2) + padding * 2
  const viewBoxHeight =
    (Number.isFinite(maxY) && Number.isFinite(minY) ? maxY - minY : hexSize * 2) + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  return (
    <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <g id="hex-grid">
          {calculatedHexes.map((hex: any) => {
            const cx = hex.x + offsetX
            const cy = hex.y + offsetY
            const points = getHexPoints(cx, cy, hexSize, orientation)
            const fillColor = TERRAIN_COLORS[hex.hexType] || TERRAIN_COLORS.default

            const href =
              typeof hex.link === "string" ? resolveHexLink(hex.link, currentSlug, allSlugs) : ""
            const tile = (
              <g
                onClick={onHexClick ? () => onHexClick(hex) : undefined}
                style={{
                  cursor: href || onHexClick ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                <polygon
                  points={points}
                  fill={fillColor}
                  stroke={settings?.showGrid ? "#334155" : "none"}
                  strokeWidth={1}
                  opacity={1.0}
                />

                {settings?.showLabels && hex.label && (
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize={Math.max(8, hexSize * 0.26)}
                    fill="#f8fafc"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {hex.label}
                  </text>
                )}

                {settings?.showCoordinates && (
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize={hexSize * 0.35}
                    fill="#ffffff"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {`${hex.q},${hex.r}`}
                  </text>
                )}
              </g>
            )

            return href ? (
              <a
                key={`${hex.q},${hex.r}`}
                href={href}
                // Quartz popovers expect HTMLAnchorElement.href, not SVGAnimatedString.
                data-no-popover="true"
                class={/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) ? "external" : "internal"}
                aria-label={hex.label || `Hex ${hex.q},${hex.r}`}
                onClick={onHexClick ? (event) => event.preventDefault() : undefined}
              >
                {tile}
              </a>
            ) : (
              <g key={`${hex.q},${hex.r}`}>{tile}</g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
