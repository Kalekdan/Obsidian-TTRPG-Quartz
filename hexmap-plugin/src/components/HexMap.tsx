const TERRAIN_COLORS: Record<string, string> = {
  "deep-ocean": "#1e3a8a",
  ocean: "#2563eb",
  coast: "#93c5fd",
  grassland: "#4ade80",
  forest: "#15803d",
  mountain: "#64748b",
  hills: "#84cc16",
  desert: "#fde047",
  swamp: "#3f6212",
  default: "#e2e8f0",
}

function axialToPixel(q: number, r: number, size: number, orientation = "pointy") {
  if (orientation === "flat") {
    return {
      x: size * ((3 / 2) * q),
      y: size * (Math.sqrt(3) * r + (Math.sqrt(3) / 2) * q),
    }
  }

  return {
    x: size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
    y: size * ((3 / 2) * r),
  }
}

function getHexPoints(centerX: number, centerY: number, size: number) {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30)
    const px = centerX + size * Math.cos(angleRad)
    const py = centerY + size * Math.sin(angleRad)
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`)
  }
  return points.join(" ")
}

export default function HexMap({
  mapData,
  onHexClick,
}: {
  mapData?: any
  onHexClick?: (hex: any) => void
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
    const { x, y } = axialToPixel(Number(hex.q), Number(hex.r), hexSize, orientation)

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

  const handleTileClick = (hex: any) => {
    if (onHexClick) {
      onHexClick(hex)
      return
    }

    if (hex.link && typeof window !== "undefined") {
      window.location.assign(hex.link)
    }
  }

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
            const points = getHexPoints(cx, cy, hexSize)
            const fillColor = TERRAIN_COLORS[hex.hexType] || TERRAIN_COLORS.default

            return (
              <g
                key={`${hex.q},${hex.r}`}
                onClick={() => handleTileClick(hex)}
                style={{ cursor: hex.link ? "pointer" : "default", transition: "all 0.15s ease" }}
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
          })}
        </g>
      </svg>
    </div>
  )
}
