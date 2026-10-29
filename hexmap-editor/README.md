# Hex Map Studio

A standalone, lightweight browser editor for this repository's Quartz HexMap frontmatter. It parses YAML locally in your browser, renders the map, lets you edit tiles and map settings, and copies updated frontmatter for pasting back into your Markdown page. No map content is uploaded.

## Run locally

From this directory:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). To make a production build, run `npm run build`; preview it with `npm run preview`.

## Use

- Paste either the complete `---`-delimited frontmatter block or YAML contents into the source panel.
- Click a tile to edit its coordinates, terrain, label, and link in the inspector. Drag across tiles to select multiple; choosing a terrain applies it to all selected tiles.
- Change orientation, hex size, grid lines, labels, and coordinate display in map settings.
- Click empty map space to add a tile at that location, or click and drag across empty space to paint a row of new tiles. New tiles use the default `deep-ocean` terrain and are added only once per coordinate. Dragging across existing tiles still selects them. **Add hex** places a tile above the map and shifts coordinates when needed to keep them non-negative. Use **Delete** in the inspector to remove the selected tile.
- Click **Copy frontmatter** and replace the `hexmap:` section in your Quartz page with the copied block.

## Shared terrain palette

The editor and Quartz plugin both import [../hexmap-terrain-colors.json](../hexmap-terrain-colors.json). Edit that file to add or change terrain colors; use lowercase hyphenated names and six-digit hex colors. Every entry except `default` automatically appears in the editor's terrain selector. Existing maps keep their terrain names and colors, and unknown terrain names use `default`.

Space terrains include empty space, nebulae, asteroid and ice belts, comets, planets, moons, stellar types, black holes, wormholes, stations, and jump routes. For example, use `hexType: gas-giant`, `hexType: emission-nebula`, or `hexType: neutron-star` in your map frontmatter.

## Netlify deployment

Keep the Netlify base directory set to `hexmap-editor`, build command `npm run build`, and publish directory `dist`. Use Node 22 or newer. Netlify must check out this repository, including the shared JSON file in its parent directory; copying only the editor folder is not sufficient. Vite bundles the shared palette into the production assets, so no runtime config fetch or extra published file is needed. Redeploy the editor after changing the palette.

The app uses the same pointy/flat offset grid calculations as `hexmap-plugin`.
