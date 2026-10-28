import assert from "node:assert/strict"
import test from "node:test"
import { offsetToPixel, resolveHexLink, TERRAIN_COLORS } from "./hexMapUtils"

test("pointy layout alternates successive rows horizontally", () => {
  const size = 30
  const first = offsetToPixel(0, 0, size)
  const second = offsetToPixel(0, 1, size)
  const third = offsetToPixel(0, 2, size)

  assert.equal(first.x, third.x)
  assert.equal(second.x - first.x, (Math.sqrt(3) * size) / 2)
  assert.equal(second.y - first.y, 1.5 * size)
})

test("flat layout alternates successive columns vertically", () => {
  const size = 30
  const first = offsetToPixel(0, 0, size, "flat")
  const second = offsetToPixel(1, 0, size, "flat")
  const third = offsetToPixel(2, 0, size, "flat")

  assert.equal(first.y, third.y)
  assert.equal(second.x - first.x, 1.5 * size)
  assert.equal(second.y - first.y, (Math.sqrt(3) * size) / 2)
})

test("handles negative odd coordinates consistently", () => {
  const pointy = offsetToPixel(0, -1, 20)
  const flat = offsetToPixel(-1, 0, 20, "flat")

  assert.equal(pointy.x, Math.sqrt(3) * 10)
  assert.equal(flat.y, Math.sqrt(3) * 10)
})

test("resolves Obsidian wikilinks to Quartz page URLs", () => {
  assert.equal(
    resolveHexLink("[[The Lighthouse Keeper]]", "maps/hex-map", ["the-lighthouse-keeper"]),
    "../the-lighthouse-keeper",
  )
  assert.equal(
    resolveHexLink("[[The Isles of Fate#Locations|Isles]]", "maps/hex-map", ["the-isles-of-fate"]),
    "../the-isles-of-fate#locations",
  )
  assert.equal(resolveHexLink("https://example.com/map", "hex-map"), "https://example.com/map")
})

test("matches nested page paths and preserves existing URL links", () => {
  assert.equal(
    resolveHexLink("[[Resources/Equipment]]", "maps/hex-map", ["resources/equipment"]),
    "../resources/equipment",
  )
  assert.equal(resolveHexLink("./local-map", "hex-map"), "./local-map")
})

test("provides colors for additional terrain types", () => {
  for (const terrain of ["river", "jungle", "tundra", "badlands", "ruins", "settlement"]) {
    assert.ok(TERRAIN_COLORS[terrain], `missing color for ${terrain}`)
  }
})
