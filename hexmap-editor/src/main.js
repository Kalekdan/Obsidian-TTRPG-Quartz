import { parse, stringify } from "yaml"
import "./style.css"

const terrains = {
  "deep-ocean": "#1e3a8a", ocean: "#2563eb", sea: "#5685ea", coast: "#93c5fd", river: "#38bdf8", lake: "#0ea5e9",
  grassland: "#4ade80", plains: "#86efac", forest: "#15803d", woodland: "#22c55e", jungle: "#166534",
  rainforest: "#14532d", hills: "#84cc16", mountain: "#64748b", snow: "#f1f5f9", tundra: "#cbd5e1",
  ice: "#bae6fd", desert: "#fde047", badlands: "#c2410c", savanna: "#d9a441", swamp: "#3f6212",
  marsh: "#65a30d", volcanic: "#57534e", lava: "#dc2626", farmland: "#a3e635", oasis: "#14b8a6",
  road: "#a8a29e", ruins: "#78716c", settlement: "#e879f9", default: "#e2e8f0",
}
const sample = `---
hexmap:
  settings:
    width: 12
    height: 8
    hexSize: 30
    orientation: pointy
    showGrid: true
    showLabels: true
    showCoordinates: false
  hexes:
    - q: 0
      r: 0
      hexType: forest
      label: Village
      link: "[[Village#History|Visit village]]"
    - q: 1
      r: 0
      hexType: grassland
    - q: 0
      r: 1
      hexType: river
---`

const app = document.querySelector("#app")
app.innerHTML = `
  <header class="topbar"><a class="brand" href="#">HEX<span>MAP</span> STUDIO</a><div class="top-actions"><button id="sample" class="button quiet">Load example</button><button id="copy" class="button primary">Copy frontmatter <span>↗</span></button></div></header>
  <main class="layout">
    <section class="editor-panel"><div class="panel-heading"><div><span class="eyebrow">01 / SOURCE</span><h1>Bring your map to life.</h1></div><span class="live-dot">LIVE</span></div><p class="intro">Paste the <code>hexmap:</code> frontmatter from your Quartz page. Your map stays in this browser.</p><label class="field-label" for="source">PAGE FRONTMATTER <span>YAML</span></label><textarea id="source" spellcheck="false" aria-label="Paste page frontmatter"></textarea><div class="source-footer"><span id="status">Waiting for frontmatter</span><span id="tile-count">0 HEXES</span></div><div class="tip"><span>✳</span><p>Paste the contents between <code>---</code> markers, or paste the complete frontmatter block.</p></div></section>
    <section class="canvas-panel"><div class="panel-heading canvas-heading"><div><span class="eyebrow">02 / CANVAS</span><h2>Your hex map</h2></div><div class="view-controls"><button id="zoom-out" class="icon-button" aria-label="Zoom out">−</button><span id="zoom-label">100%</span><button id="zoom-in" class="icon-button" aria-label="Zoom in">+</button><span class="divider"></span><button id="fit" class="text-button">FIT</button></div></div><div class="canvas-wrap"><div id="canvas" class="canvas"><svg id="map" role="img" aria-label="Editable hex map"></svg></div><div id="empty" class="empty-state"><span>⌘</span><h3>Your canvas awaits</h3><p>Paste valid hexmap frontmatter to start editing.</p></div></div><div class="canvas-footer"><div><span class="legend-dot"></span> TERRAIN</div><span>CLICK A HEX TO EDIT · CLICK EMPTY SPACE TO ADD</span></div></section>
    <aside class="inspector"><div class="panel-heading"><div><span class="eyebrow">03 / INSPECTOR</span><h2>Map settings</h2></div></div><div class="inspector-body"><label class="control-label">ORIENTATION<select id="orientation"><option value="pointy">Pointy top</option><option value="flat">Flat top</option></select></label><label class="control-label">HEX SIZE <span id="size-value">30</span><input id="size" type="range" min="12" max="60" value="30"></label><div class="toggle-row"><span>Grid lines</span><label class="switch"><input id="grid" type="checkbox"><i></i></label></div><div class="toggle-row"><span>Tile labels</span><label class="switch"><input id="labels" type="checkbox"><i></i></label></div><div class="toggle-row"><span>Coordinates</span><label class="switch"><input id="coordinates" type="checkbox"><i></i></label></div><div class="selection" id="selection"><div class="selection-heading"><span class="eyebrow">SELECTED HEX</span><button id="delete" class="delete-button" title="Delete selected hex">DELETE</button></div><div class="coord-line"><span>Q</span><input id="q" type="number" aria-label="Hex q coordinate"><span>R</span><input id="r" type="number" aria-label="Hex r coordinate"></div><label class="control-label">TERRAIN<select id="terrain"></select></label><label class="control-label">LABEL<input id="label" type="text" placeholder="A place name"></label><label class="control-label">LINK<input id="link" type="text" placeholder="[[Page#Heading|Alias]]"></label></div><div class="inspector-hint">Select a hex on the canvas to change its terrain, label, link, or position.</div></div><div class="inspector-bottom"><button id="add" class="button add-button">＋ &nbsp; Add hex</button><button id="clear" class="text-button clear-button">Clear map</button></div></aside>
  </main><footer class="app-footer"><span>HEX MAP STUDIO <span class="muted">· A local tool for Quartz</span></span><span>NO DATA LEAVES YOUR DEVICE</span></footer><div id="toast" class="toast" role="status"></div>
`

const $ = (selector) => document.querySelector(selector)
const source = $("#source")
const state = { map: null, selected: null, zoom: 1 }
const terrainSelect = $("#terrain")
for (const name of Object.keys(terrains).filter((name) => name !== "default")) terrainSelect.add(new Option(name.replaceAll("-", " "), name))
function key(hex) { return `${hex.q},${hex.r}` }
function defaultMap() { return { settings: { width: 40, height: 30, hexSize: 30, orientation: "pointy", showGrid: true, showLabels: true, showCoordinates: false }, hexes: [] } }
function toFrontmatter(map) { return `---\n${stringify({ hexmap: map }, { lineWidth: 0 }).trimEnd()}\n---` }
function parseSource(value) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const wrapped = trimmed.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s|$)/)
  const yaml = wrapped ? wrapped[1] : trimmed.replace(/^---\s*\r?\n/, "").replace(/\r?\n---\s*$/, "")
  const doc = parse(yaml)
  const map = doc?.hexmap ?? doc?.hexMap
  if (!map || typeof map !== "object" || Array.isArray(map)) throw new Error("Couldn't find a hexmap object. Check for a top-level hexmap: key.")
  if (!Array.isArray(map.hexes)) map.hexes = []
  map.settings = { ...defaultMap().settings, ...(map.settings ?? {}) }
  map.hexes = map.hexes.filter((hex) => hex && Number.isFinite(Number(hex.q)) && Number.isFinite(Number(hex.r))).map((hex) => ({ ...hex, q: Number(hex.q), r: Number(hex.r), hexType: hex.hexType || "grassland" }))
  return map
}
function center(q, r, size, orientation) {
  if (orientation === "flat") return { x: size * 1.5 * q, y: size * Math.sqrt(3) * (r + (Math.abs(q % 2) ? 0.5 : 0)) }
  return { x: size * Math.sqrt(3) * (q + (Math.abs(r % 2) ? 0.5 : 0)), y: size * 1.5 * r }
}
function svgElement(name, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name)
  for (const [attr, value] of Object.entries(attrs)) element.setAttribute(attr, String(value))
  return element
}
function syncControls() {
  if (!state.map) return
  const settings = state.map.settings
  $("#orientation").value = settings.orientation === "flat" ? "flat" : "pointy"
  $("#size").value = Math.min(60, Math.max(12, Number(settings.hexSize) || 30))
  $("#size-value").textContent = settings.hexSize
  $("#grid").checked = settings.showGrid !== false
  $("#labels").checked = settings.showLabels !== false
  $("#coordinates").checked = settings.showCoordinates === true
  const selected = state.map.hexes.find((hex) => key(hex) === state.selected)
  $("#selection").classList.toggle("visible", Boolean(selected))
  if (!selected) return
  $("#q").value = selected.q; $("#r").value = selected.r
  $("#terrain").value = terrains[selected.hexType] ? selected.hexType : "grassland"
  $("#label").value = selected.label ?? ""; $("#link").value = selected.link ?? ""
}
function render() {
  if (!state.map) { $("#empty").classList.remove("hidden"); $("#map").replaceChildren(); $("#tile-count").textContent = "0 HEXES"; return }
  const { settings, hexes } = state.map
  const orientation = settings.orientation === "flat" ? "flat" : "pointy", size = Math.max(1, Number(settings.hexSize) || 30)
  const coords = hexes.map((hex) => ({ hex, ...center(hex.q, hex.r, size, orientation) }))
  if (!coords.length) { $("#map").setAttribute("viewBox", "0 0 120 100"); $("#map").replaceChildren(); $("#empty").classList.remove("hidden") }
  else {
    $("#empty").classList.add("hidden")
    const xs = coords.map(({ x }) => x), ys = coords.map(({ y }) => y), pad = size * 1.7
    const minX = Math.min(...xs) - size - pad, maxX = Math.max(...xs) + size + pad, minY = Math.min(...ys) - size - pad, maxY = Math.max(...ys) + size + pad
    $("#map").setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
    const group = svgElement("g")
    for (const { hex, x, y } of coords) {
      const angle = orientation === "flat" ? 0 : -30
      const polygonPoints = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i + angle); return `${(x + size * Math.cos(a)).toFixed(2)},${(y + size * Math.sin(a)).toFixed(2)}` }).join(" ")
      const tile = svgElement("g", { class: `tile${key(hex) === state.selected ? " selected" : ""}`, tabindex: 0, role: "button", "aria-label": `Hex ${hex.q}, ${hex.r}, ${hex.hexType}` })
      tile.append(svgElement("polygon", { points: polygonPoints, fill: terrains[hex.hexType] || terrains.default, stroke: settings.showGrid === false ? "none" : "#d5c9a866", "stroke-width": 1.5 }))
      const text = settings.showLabels !== false && hex.label ? hex.label : settings.showCoordinates ? `${hex.q},${hex.r}` : ""
      if (text) { const label = svgElement("text", { x, y: y + 4, "text-anchor": "middle", "font-size": Math.max(9, size * 0.25), fill: "#f8fafc" }); label.textContent = text.length > 16 ? `${text.slice(0, 15)}…` : text; tile.append(label) }
      tile.addEventListener("click", (event) => { event.stopPropagation(); state.selected = key(hex); syncControls(); render() })
      tile.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tile.dispatchEvent(new MouseEvent("click", { bubbles: true })) } })
      group.append(tile)
    }
    $("#map").replaceChildren(group)
  }
  $("#map").style.transform = `scale(${state.zoom})`
  $("#tile-count").textContent = `${hexes.length.toLocaleString()} HEX${hexes.length === 1 ? "" : "ES"}`
  syncControls()
}
function updateSource() { if (state.map) source.value = toFrontmatter(state.map); render() }
function parseAndRender() {
  try { state.map = parseSource(source.value); state.selected = null; $("#status").textContent = state.map ? "Frontmatter parsed" : "Waiting for frontmatter"; $("#status").classList.remove("error"); source.classList.remove("invalid"); render() }
  catch (error) { state.map = null; $("#status").textContent = error.message; $("#status").classList.add("error"); source.classList.add("invalid"); render() }
}
function selectedHex() { return state.map?.hexes.find((hex) => key(hex) === state.selected) }
function editSelected(edit) { const hex = selectedHex(); if (!hex) return; edit(hex); updateSource() }
let parseTimer
source.value = sample; parseAndRender()
source.addEventListener("input", () => { clearTimeout(parseTimer); parseTimer = setTimeout(parseAndRender, 200) })
$("#sample").addEventListener("click", () => { source.value = sample; parseAndRender() })
$("#orientation").addEventListener("change", (e) => { if (state.map) { state.map.settings.orientation = e.target.value; updateSource() } })
$("#size").addEventListener("input", (e) => { if (state.map) { state.map.settings.hexSize = Number(e.target.value); $("#size-value").textContent = e.target.value; updateSource() } })
for (const [selector, field] of [["#grid", "showGrid"], ["#labels", "showLabels"], ["#coordinates", "showCoordinates"]]) $(selector).addEventListener("change", (e) => { if (state.map) { state.map.settings[field] = e.target.checked; updateSource() } })
$("#terrain").addEventListener("change", (e) => editSelected((hex) => { hex.hexType = e.target.value }))
$("#label").addEventListener("input", (e) => editSelected((hex) => { if (e.target.value) hex.label = e.target.value; else delete hex.label }))
$("#link").addEventListener("input", (e) => editSelected((hex) => { if (e.target.value) hex.link = e.target.value; else delete hex.link }))
for (const selector of ["#q", "#r"]) $(selector).addEventListener("change", () => {
  const hex = selectedHex(); if (!hex) return
  const q = selector === "#q" ? Number($("#q").value) : hex.q, r = selector === "#r" ? Number($("#r").value) : hex.r
  if (state.map.hexes.some((item) => item !== hex && item.q === q && item.r === r)) { notify("Those coordinates are already occupied"); syncControls(); return }
  hex.q = q; hex.r = r; state.selected = key(hex); updateSource()
})
function addHex(q, r) { if (!state.map.hexes.some((hex) => hex.q === q && hex.r === r)) { const hex = { q, r, hexType: "grassland" }; state.map.hexes.push(hex); state.selected = key(hex); updateSource(); return true } return false }
$("#add").addEventListener("click", () => {
  if (!state.map) { state.map = defaultMap(); source.value = toFrontmatter(state.map) }
  const hexes = state.map.hexes, maxQ = Math.max(-1, ...hexes.map((h) => h.q)), maxR = Math.max(-1, ...hexes.map((h) => h.r))
  const q = hexes.length && !hexes.some((h) => h.q === maxQ + 1 && h.r === 0) ? maxQ + 1 : 0
  const r = q === 0 && hexes.some((h) => h.q === 0 && h.r === maxR + 1) ? maxR + 1 : 0
  addHex(q, r)
})
$("#delete").addEventListener("click", () => { const hex = selectedHex(); if (!hex) return; state.map.hexes = state.map.hexes.filter((item) => item !== hex); state.selected = null; updateSource() })
$("#clear").addEventListener("click", () => { if (state.map && confirm("Remove every hex from this map?")) { state.map.hexes = []; state.selected = null; updateSource() } })
$("#map").addEventListener("click", (event) => {
  if (!state.map || event.target.closest(".tile")) return
  const svg = $("#map"), rect = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = vb.x + (event.clientX - rect.left) / rect.width * vb.width, y = vb.y + (event.clientY - rect.top) / rect.height * vb.height
  const size = Number(state.map.settings.hexSize) || 30, orientation = state.map.settings.orientation, qValues = state.map.hexes.map((h) => h.q), rValues = state.map.hexes.map((h) => h.r)
  const range = Math.max(5, Math.max(...qValues, ...rValues, 0) - Math.min(...qValues, ...rValues, 0) + 3)
  let best = null, distance = Infinity
  for (let q = -range; q <= range; q++) for (let r = -range; r <= range; r++) { const c = center(q, r, size, orientation), d = (x - c.x) ** 2 + (y - c.y) ** 2; if (d < distance) { distance = d; best = [q, r] } }
  if (best && distance < (size * 1.1) ** 2 && !addHex(best[0], best[1])) { const existing = state.map.hexes.find((hex) => hex.q === best[0] && hex.r === best[1]); state.selected = key(existing); syncControls(); render() }
})
$("#zoom-in").addEventListener("click", () => setZoom(state.zoom + 0.15))
$("#zoom-out").addEventListener("click", () => setZoom(state.zoom - 0.15))
$("#fit").addEventListener("click", () => setZoom(1))
function setZoom(value) { state.zoom = Math.min(1.8, Math.max(0.5, value)); $("#zoom-label").textContent = `${Math.round(state.zoom * 100)}%`; render() }
let toastTimer
function notify(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2800) }
$("#copy").addEventListener("click", async () => {
  if (!state.map) { notify("Fix the frontmatter errors before copying"); return }
  try { await navigator.clipboard.writeText(toFrontmatter(state.map)) } catch { source.focus(); source.select(); document.execCommand("copy") }
  notify("Frontmatter copied — ready to paste into your Quartz page")
})
