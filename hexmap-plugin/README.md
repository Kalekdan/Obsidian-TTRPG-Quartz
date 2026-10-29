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

The single source of terrain colors is [../hexmap-terrain-colors.json](../hexmap-terrain-colors.json), shared with the browser editor. Add or change entries there using lowercase hyphenated names and six-digit hex colors. The editor automatically lists every entry except `default`; unrecognized terrain names use the default color. Existing terrestrial terrain names and colors are unchanged (including `sea`).

Space terrain names:

- Space: `deep-space`, `interstellar-space`, `interplanetary-space`, `void`.
- Nebulae and clouds: `nebula`, `emission-nebula`, `reflection-nebula`, `dark-nebula`, `planetary-nebula`, `supernova-remnant`, `star-forming-region`, `dust-cloud`, `gas-cloud`.
- Belts and small bodies: `asteroid-field`, `asteroid-belt`, `debris-field`, `comet`, `comet-cloud`, `ice-belt`.
- Planets and moons: `rocky-planet`, `terrestrial-planet`, `ocean-planet`, `desert-planet`, `ice-planet`, `volcanic-planet`, `gas-giant`, `ice-giant`, `moon`, `planetary-rings`.
- Stars and remnants: `star`, `yellow-star`, `red-dwarf`, `red-giant`, `blue-giant`, `white-dwarf`, `brown-dwarf`, `neutron-star`, `pulsar`, `binary-star`, `black-hole`, `accretion-disk`.
- Travel and infrastructure: `wormhole`, `space-station`, `orbital-habitat`, `jump-gate`, `hyperspace-lane`.

Use these names as `hexType` in frontmatter, for example `hexType: asteroid-belt`.

## Development

Use Node 22 or newer. Install from this directory with `npm install --ignore-scripts --no-package-lock`, then run `npm run build` before building Quartz; the local plugin loader consumes `dist`. Build from a checkout of this repository so the shared JSON file is available. The existing GitHub Pages workflow already does this. Tsup embeds the palette in `dist`, so the built plugin needs no parent-directory config or runtime JSON fetch. Rebuild the plugin and redeploy Quartz after changing the palette.

The runtime utilities dependency uses a published npm release containing compiled output. Do not replace it with a GitHub source dependency: script-disabled installs do not build that dependency, and Quartz can silently omit the component when its import fails. If an existing installation retains the old GitHub copy, run `npm install @quartz-community/utils@1.0.1 --save-exact --ignore-scripts --no-package-lock`.

After building, run `node --test built-package.test.mjs` from this directory to test the actual JavaScript package (without a TypeScript loader). The Pages workflow runs this check and verifies that the generated sample page contains all 1,200 tiles before uploading it.

Run regression tests from the repository root (using its existing test dependencies):

```powershell
node .\node_modules\tsx\dist\cli.mjs --tsconfig .\hexmap-plugin\tsconfig.json --test .\hexmap-plugin\src\components\hexMapUtils.test.ts .\hexmap-plugin\src\components\HexMap.test.tsx
node .\node_modules\typescript\bin\tsc --noEmit -p .\hexmap-plugin\tsconfig.json
```

Tests cover offset coordinates, shared polygon edges in both orientations, static links, parsing/defaults, terrain colors, and the 1,200-tile sample.
