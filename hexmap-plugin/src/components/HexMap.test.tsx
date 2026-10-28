import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { render } from "preact-render-to-string"
import { parse } from "yaml"
import HexMap from "./HexMap"
import HexMapViewer, { normalizeHexMapData, parseHexMapFromMarkdown } from "./HexMapViewer"
import { resolveHexLink } from "./hexMapUtils"

function renderTiles(orientation: string) {
  return render(
    <HexMap
      mapData={{
        settings: { orientation, hexSize: 30 },
        hexes: [
          { q: 0, r: 0 },
          { q: 0, r: 1 },
          { q: 1, r: 0 },
        ],
      }}
    />,
  )
}

test("both orientations tessellate with shared polygon edges", () => {
  for (const orientation of ["pointy", "flat"]) {
    const html = renderTiles(orientation)
    const polygons = [...html.matchAll(/points="([^"]+)"/g)].map((match) =>
      match[1].split(" ").map((point) => point.split(",").map(Number)),
    )
    assert.equal(polygons.length, 3)
    for (const neighbor of polygons.slice(1)) {
      const shared = polygons[0].filter(([x, y]) =>
        neighbor.some(([nx, ny]) => Math.abs(x - nx) < 0.02 && Math.abs(y - ny) < 0.02),
      )
      assert.equal(shared.length, 2, `${orientation} neighbor must share an edge`)
    }
    const xs = polygons[0].map(([x]) => x)
    const ys = polygons[0].map(([, y]) => y)
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    assert.equal(width > height, orientation === "flat")
  }
})

test("viewer renders navigable SVG anchors using Quartz file slugs", () => {
  const Viewer = HexMapViewer()
  const html = render(
    <Viewer
      fileData={{
        slug: "maps/world",
        frontmatter: {
          hexmap: {
            hexes: [
              { q: 0, r: 0, link: "[[Page Name#Locations|Visit]]", label: "Town" },
              { q: 1, r: 0, link: "https://example.com" },
              { q: 2, r: 0 },
            ],
          },
        },
      }}
      allFiles={[{ slug: "lore/page-name" }]}
    />,
  )
  assert.match(
    html,
    /<a[^>]+href="\.\.\/lore\/page-name#locations"[^>]+class="internal"[^>]+aria-label="Town"/,
  )
  assert.match(html, /<a[^>]+href="https:\/\/example.com"[^>]+class="external"/)
  assert.equal((html.match(/data-no-popover="true"/g) ?? []).length, 2)
  assert.equal((html.match(/<a /g) ?? []).length, 2)
  assert.equal((html.match(/<polygon /g) ?? []).length, 3)
})

test("handles local headings, markdown extensions and unusable links", () => {
  assert.equal(resolveHexLink("[[#Local Heading]]", "maps/world"), "#local-heading")
  assert.equal(
    resolveHexLink("[[Page Name.md]]", "maps/world", ["lore/page-name"]),
    "../lore/page-name",
  )
  assert.equal(resolveHexLink("[[Missing Page]]", "world"), "./missing-page")
  assert.equal(resolveHexLink("[[ ]]", "world"), "")
  assert.equal(resolveHexLink("javascript:alert(1)", "world"), "")
})

test("preserves JSON map parsing and default settings", () => {
  const map = { hexes: [{ q: 0, r: 0, hexType: "forest" }] }
  assert.deepEqual(parseHexMapFromMarkdown(JSON.stringify(map)), map)
  assert.deepEqual(
    parseHexMapFromMarkdown("Example\n```json\n" + JSON.stringify(map) + "\n```"),
    map,
  )
  assert.equal(parseHexMapFromMarkdown("not a map"), null)
  const normalized = normalizeHexMapData(map)
  assert.equal(normalized?.settings.orientation, "pointy")
  assert.equal((render(<HexMap mapData={normalized} />).match(/<polygon /g) ?? []).length, 1)
  assert.equal(render(<HexMap />), "")
})

test("renders every tile in the large sample in both orientations", () => {
  const source = readFileSync(
    new URL("../../../content/Hex Map Sample.md", import.meta.url),
    "utf8",
  )
  const map = parse(source.split(/^---\s*$/m)[1]).hexmap
  assert.equal(map.hexes.length, 1200)
  for (const orientation of ["pointy", "flat"]) {
    const html = render(<HexMap mapData={{ ...map, settings: { ...map.settings, orientation } }} />)
    assert.equal((html.match(/<polygon /g) ?? []).length, 1200)
    assert.doesNotMatch(html, /NaN|Infinity/)
  }
})
