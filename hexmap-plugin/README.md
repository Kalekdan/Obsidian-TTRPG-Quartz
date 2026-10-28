# Hex Map

A Quartz component that renders hex maps from `hexmap` (or `hexMap`) page frontmatter. Map data can also be supplied as JSON or a fenced JSON block through `fileData.content` / `fileData.rawBody`.

```yaml
---
hexmap:
  settings:
    orientation: pointy
    hexSize: 30
    showGrid: true
    showLabels: true
    showCoordinates: false
  hexes:
    - q: 0
      r: 0
      hexType: forest
      label: Village
      link: "[[Village#History|Visit village]]"
    - q: 0
      r: 1
      hexType: river
---
```

All tiles belong **inside** `hexmap.hexes`.

## Coordinates and orientation

Coordinates use an **offset grid**, not axial coordinates:

- `pointy` (default): `q` is the column and `r` is the row. Odd rows shift right by half a hex width; `(0,2)` is directly below `(0,0)`.
- `flat`: odd columns shift down by half a hex height; `(2,0)` is directly right of `(0,0)`.
- Negative odd rows/columns use the same right/down offset.

`hexSize` is the center-to-corner radius. Tiles fit into a responsive SVG, including large maps.

## Links

Links are real SVG anchors, so they work in static Quartz pages without client-side hydration. Wikilinks support page names, paths, `.md` extensions, headings, and display aliases. Resolution uses Quartz's shortest-path rules and the page slugs supplied by `allFiles` (or an explicit `allSlugs` prop). `[[#Heading]]` links within the current page. Aliases do not change the tile label; use `label` for that.

Existing relative URLs and HTTP(S), mailto, and tel links are also accepted. Unknown page names get a normalized URL; the target page must exist to navigate successfully. Unsupported URL schemes are not rendered as links. An interactive consumer can supply `onHexClick` to override normal navigation.

## Terrain palette

`deep-ocean`, `ocean`, `coast`, `river`, `lake`, `grassland`, `plains`, `forest`, `woodland`, `jungle`, `rainforest`, `hills`, `mountain`, `snow`, `tundra`, `ice`, `desert`, `badlands`, `savanna`, `swamp`, `marsh`, `volcanic`, `lava`, `farmland`, `oasis`, `road`, `ruins`, `settlement`.

Unrecognized terrain names use the default color.

## Development

Build from this directory with `npm run build` before building Quartz; the local plugin loader consumes `dist`.

Run regression tests from the repository root (using its existing test dependencies):

```powershell
node .\node_modules\tsx\dist\cli.mjs --tsconfig .\hexmap-plugin\tsconfig.json --test .\hexmap-plugin\src\components\hexMapUtils.test.ts .\hexmap-plugin\src\components\HexMap.test.tsx
node .\node_modules\typescript\bin\tsc --noEmit -p .\hexmap-plugin\tsconfig.json
```

Tests cover offset coordinates, shared polygon edges in both orientations, static links, parsing/defaults, terrain colors, and the 1,200-tile sample.
