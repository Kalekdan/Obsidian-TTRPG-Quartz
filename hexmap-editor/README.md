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
- Click a tile to edit its coordinates, terrain, label, and link in the inspector.
- Change orientation, hex size, grid lines, labels, and coordinate display in map settings.
- Click empty map space or **Add hex** to add a tile; use **Delete** in the inspector to remove the selected tile.
- Click **Copy frontmatter** and replace the `hexmap:` section in your Quartz page with the copied block.

The app uses the terrain palette and pointy/flat offset grid calculations from `hexmap-plugin`. It is intentionally in its own directory and does not modify the Quartz plugin or deployment workflow.
