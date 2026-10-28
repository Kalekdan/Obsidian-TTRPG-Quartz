import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { h } from "preact"
import { render } from "preact-render-to-string"
import { parse } from "yaml"
import { HexMapViewer } from "./dist/components/index.js"

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
