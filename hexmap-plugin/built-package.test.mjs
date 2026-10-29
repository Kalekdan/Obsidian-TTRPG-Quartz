import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { h } from "preact"
import { render } from "preact-render-to-string"
import { parse } from "yaml"
import { HexMap, HexMapViewer } from "./dist/components/index.js"

const terrainColors = JSON.parse(
  readFileSync(new URL("../hexmap-terrain-colors.json", import.meta.url), "utf8"),
)

test("built component renders every shared terrain color and the unknown-terrain fallback", () => {
  const terrains = [...Object.keys(terrainColors), "unknown-terrain"]
  const html = render(
    h(HexMap, {
      mapData: {
        hexes: terrains.map((hexType, q) => ({ q, r: 0, hexType })),
      },
    }),
  )
  const fills = [...html.matchAll(/<polygon\b[^>]*\bfill="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(
    fills,
    terrains.map((terrain) => terrainColors[terrain] ?? terrainColors.default),
  )
})

test("built component loads and renders the complete sample", () => {
  const markdown = readFileSync(new URL("../content/Hex Map Sample.md", import.meta.url), "utf8")
  const frontmatter = parse(markdown.split(/^---\s*$/m)[1])
  const html = render(
    h(HexMapViewer(), {
      fileData: { slug: "hex-map-sample", frontmatter },
      allFiles: [],
    }),
  )
  assert.equal(frontmatter.hexmap.hexes.length, 1200)
  assert.match(html, /id="hex-grid"/)
  assert.equal((html.match(/<polygon\b/g) ?? []).length, 1200)
})
