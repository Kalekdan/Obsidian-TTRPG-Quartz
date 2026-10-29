import { parse, stringify } from "yaml"
import terrains from "../../hexmap-terrain-colors.json"
import "./style.css"
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
    <section class="canvas-panel"><div class="panel-heading canvas-heading"><div><span class="eyebrow">02 / CANVAS</span><h2>Your hex map</h2></div><div class="view-controls"><button id="zoom-out" class="icon-button" aria-label="Zoom out">−</button><span id="zoom-label">100%</span><button id="zoom-in" class="icon-button" aria-label="Zoom in">+</button><span class="divider"></span><button id="fit" class="text-button">FIT</button></div></div><div class="canvas-wrap"><div id="canvas" class="canvas"><svg id="map" role="img" aria-label="Editable hex map"></svg></div><div id="empty" class="empty-state"><span>⌘</span><h3>Your canvas awaits</h3><p>Paste valid hexmap frontmatter to start editing.</p></div></div><div class="canvas-footer"><div><span class="legend-dot"></span> TERRAIN</div><span>CLICK A HEX TO EDIT · DRAG TO SELECT · CLICK OR DRAG EMPTY SPACE TO ADD</span></div></section>
    <aside class="inspector"><div class="panel-heading"><div><span class="eyebrow">03 / INSPECTOR</span><h2>Map settings</h2></div></div><div class="inspector-body"><label class="control-label">ORIENTATION<select id="orientation"><option value="pointy">Pointy top</option><option value="flat">Flat top</option></select></label><label class="control-label">HEX SIZE <span id="size-value">30</span><input id="size" type="range" min="12" max="60" value="30"></label><div class="toggle-row"><span>Grid lines</span><label class="switch"><input id="grid" type="checkbox"><i></i></label></div><div class="toggle-row"><span>Tile labels</span><label class="switch"><input id="labels" type="checkbox"><i></i></label></div><div class="toggle-row"><span>Coordinates</span><label class="switch"><input id="coordinates" type="checkbox"><i></i></label></div><div class="selection" id="selection"><div class="selection-heading"><span class="eyebrow" id="selection-count">SELECTED HEX</span><button id="delete" class="delete-button" title="Delete selected hexes">DELETE</button></div><div class="coord-line" id="coordinates-edit"><span>Q</span><input id="q" type="number" aria-label="Hex q coordinate"><span>R</span><input id="r" type="number" aria-label="Hex r coordinate"></div><label class="control-label">TERRAIN<select id="terrain"></select></label><label class="control-label" id="label-control">LABEL<input id="label" type="text" placeholder="A place name"></label><label class="control-label" id="link-control">LINK<input id="link" type="text" placeholder="[[Page#Heading|Alias]]"></label></div><div class="inspector-hint">Click a hex to edit it, or drag across the canvas to select multiple hexes.</div></div><div class="inspector-bottom"><button id="add" class="button add-button">＋ &nbsp; Add hex</button><button id="clear" class="text-button clear-button">Clear map</button></div></aside>
  </main><footer class="app-footer"><span>HEX MAP STUDIO <span class="muted">· A local tool for Quartz</span></span><span>NO DATA LEAVES YOUR DEVICE</span></footer><div id="toast" class="toast" role="status"></div>
`

const $ = (selector) => document.querySelector(selector)
const source = $("#source")
const state = {
  map: null,
  selected: new Set(),
  zoom: 1,
  dragging: false,
  dragged: false,
  painting: false,
  pointerId: null,
  lastPainted: null,
  suppressMapClick: false,
  lastPointer: null,
}
const terrainSelect = $("#terrain")
terrainSelect.add(new Option("Mixed terrain", ""))
for (const name of Object.keys(terrains).filter((name) => name !== "default"))
  terrainSelect.add(new Option(name.replaceAll("-", " "), name))
function key(hex) {
  return `${hex.q},${hex.r}`
}
function defaultMap() {
  return {
    settings: {
      width: 40,
      height: 30,
      hexSize: 30,
      orientation: "pointy",
      showGrid: true,
      showLabels: true,
      showCoordinates: false,
    },
    hexes: [],
  }
}
function toFrontmatter(map) {
  return `---\n${stringify({ hexmap: map }, { lineWidth: 0 }).trimEnd()}\n---`
}
function parseSource(value) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const wrapped = trimmed.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s|$)/)
  const yaml = wrapped
    ? wrapped[1]
    : trimmed.replace(/^---\s*\r?\n/, "").replace(/\r?\n---\s*$/, "")
  const doc = parse(yaml)
  const map = doc?.hexmap ?? doc?.hexMap
  if (!map || typeof map !== "object" || Array.isArray(map))
    throw new Error("Couldn't find a hexmap object. Check for a top-level hexmap: key.")
  if (!Array.isArray(map.hexes)) map.hexes = []
  map.settings = { ...defaultMap().settings, ...(map.settings ?? {}) }
  map.hexes = map.hexes
    .filter((hex) => hex && Number.isFinite(Number(hex.q)) && Number.isFinite(Number(hex.r)))
    .map((hex) => ({
      ...hex,
      q: Number(hex.q),
      r: Number(hex.r),
      hexType: hex.hexType || "grassland",
    }))
  return map
}
function center(q, r, size, orientation) {
  if (orientation === "flat")
    return { x: size * 1.5 * q, y: size * Math.sqrt(3) * (r + (Math.abs(q % 2) ? 0.5 : 0)) }
  return { x: size * Math.sqrt(3) * (q + (Math.abs(r % 2) ? 0.5 : 0)), y: size * 1.5 * r }
}
function hexAtPoint(clientX, clientY) {
  const svg = $("#map"),
    point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const { x, y } = point.matrixTransform(svg.getScreenCTM().inverse())
  const size = Math.max(1, Number(state.map.settings.hexSize) || 30),
    orientation = state.map.settings.orientation
  let q, r
  if (orientation === "flat") {
    q = Math.round(x / (size * 1.5))
    r = Math.round(y / (size * Math.sqrt(3)) - (Math.abs(q % 2) ? 0.5 : 0))
  } else {
    r = Math.round(y / (size * 1.5))
    q = Math.round(x / (size * Math.sqrt(3)) - (Math.abs(r % 2) ? 0.5 : 0))
  }
  let nearest = null,
    distance = Infinity
  for (let candidateQ = q - 2; candidateQ <= q + 2; candidateQ++)
    for (let candidateR = r - 2; candidateR <= r + 2; candidateR++) {
      const position = center(candidateQ, candidateR, size, orientation)
      const candidateDistance = (x - position.x) ** 2 + (y - position.y) ** 2
      if (candidateDistance < distance) {
        distance = candidateDistance
        nearest = { q: candidateQ, r: candidateR }
      }
    }
  return distance < (size * 1.1) ** 2 ? nearest : null
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
  const selected = state.map.hexes.filter((hex) => state.selected.has(key(hex)))
  const multiple = selected.length > 1
  $("#selection").classList.toggle("visible", selected.length > 0)
  $("#selection-count").textContent = multiple
    ? `${selected.length} HEXES SELECTED`
    : "SELECTED HEX"
  $("#coordinates-edit").hidden = multiple
  $("#label-control").hidden = multiple
  $("#link-control").hidden = multiple
  $("#delete").title = `Delete ${multiple ? "selected hexes" : "selected hex"}`
  if (!selected.length) return
  $("#q").value = selected[0].q
  $("#r").value = selected[0].r
  const terrainTypes = new Set(selected.map((hex) => hex.hexType))
  $("#terrain").value =
    terrainTypes.size === 1 && terrains[selected[0].hexType] ? selected[0].hexType : ""
  $("#label").value = selected[0].label ?? ""
  $("#link").value = selected[0].link ?? ""
}
function render() {
  if (!state.map) {
    $("#empty").classList.remove("hidden")
    $("#map").replaceChildren()
    $("#tile-count").textContent = "0 HEXES"
    return
  }
  const { settings, hexes } = state.map
  const orientation = settings.orientation === "flat" ? "flat" : "pointy",
    size = Math.max(1, Number(settings.hexSize) || 30)
  const coords = hexes.map((hex) => ({ hex, ...center(hex.q, hex.r, size, orientation) }))
  if (!coords.length) {
    $("#map").setAttribute("viewBox", "-60 -50 120 100")
    $("#map").replaceChildren()
    $("#empty").classList.remove("hidden")
  } else {
    $("#empty").classList.add("hidden")
    const xs = coords.map(({ x }) => x),
      ys = coords.map(({ y }) => y),
      pad = size * 1.7
    const minX = Math.min(...xs) - size - pad,
      maxX = Math.max(...xs) + size + pad,
      minY = Math.min(...ys) - size - pad,
      maxY = Math.max(...ys) + size + pad
    $("#map").setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
    const group = svgElement("g")
    for (const { hex, x, y } of coords) {
      const angle = orientation === "flat" ? 0 : -30
      const polygonPoints = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i + angle)
        return `${(x + size * Math.cos(a)).toFixed(2)},${(y + size * Math.sin(a)).toFixed(2)}`
      }).join(" ")
      const tile = svgElement("g", {
        class: `tile${state.selected.has(key(hex)) ? " selected" : ""}`,
        tabindex: 0,
        role: "button",
        "aria-label": `Hex ${hex.q}, ${hex.r}, ${hex.hexType}`,
      })
      tile.append(
        svgElement("polygon", {
          points: polygonPoints,
          fill: terrains[hex.hexType] || terrains.default,
          stroke: settings.showGrid === false ? "none" : "#d5c9a866",
          "stroke-width": 1.5,
        }),
      )
      const text =
        settings.showLabels !== false && hex.label
          ? hex.label
          : settings.showCoordinates
            ? `${hex.q},${hex.r}`
            : ""
      if (text) {
        const label = svgElement("text", {
          x,
          y: y + 4,
          "text-anchor": "middle",
          "font-size": Math.max(9, size * 0.25),
          fill: "#f8fafc",
        })
        label.textContent = text.length > 16 ? `${text.slice(0, 15)}…` : text
        tile.append(label)
      }
      tile.dataset.key = key(hex)
      tile.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          state.selected = new Set([key(hex)])
          syncControls()
          render()
        }
      })
      group.append(tile)
    }
    $("#map").replaceChildren(group)
  }
  $("#map").style.transform = `scale(${state.zoom})`
  $("#tile-count").textContent =
    `${hexes.length.toLocaleString()} HEX${hexes.length === 1 ? "" : "ES"}`
  syncControls()
}
function updateSource() {
  if (state.map) source.value = toFrontmatter(state.map)
  render()
}
function parseAndRender() {
  try {
    state.map = parseSource(source.value)
    state.selected.clear()
    $("#status").textContent = state.map ? "Frontmatter parsed" : "Waiting for frontmatter"
    $("#status").classList.remove("error")
    source.classList.remove("invalid")
    render()
  } catch (error) {
    state.map = null
    state.selected.clear()
    $("#status").textContent = error.message
    $("#status").classList.add("error")
    source.classList.add("invalid")
    render()
  }
}
function selectedHex() {
  return state.map?.hexes.find((hex) => state.selected.has(key(hex)))
}
function editSelected(edit) {
  if (!selectedHex()) return
  for (const hex of state.map.hexes) if (state.selected.has(key(hex))) edit(hex)
  updateSource()
}
let parseTimer
source.value = sample
parseAndRender()
source.addEventListener("input", () => {
  clearTimeout(parseTimer)
  parseTimer = setTimeout(parseAndRender, 200)
})
$("#sample").addEventListener("click", () => {
  source.value = sample
  parseAndRender()
})
$("#orientation").addEventListener("change", (e) => {
  if (state.map) {
    state.map.settings.orientation = e.target.value
    updateSource()
  }
})
$("#size").addEventListener("input", (e) => {
  if (state.map) {
    state.map.settings.hexSize = Number(e.target.value)
    $("#size-value").textContent = e.target.value
    updateSource()
  }
})
for (const [selector, field] of [
  ["#grid", "showGrid"],
  ["#labels", "showLabels"],
  ["#coordinates", "showCoordinates"],
])
  $(selector).addEventListener("change", (e) => {
    if (state.map) {
      state.map.settings[field] = e.target.checked
      updateSource()
    }
  })
$("#terrain").addEventListener("change", (e) => {
  if (e.target.value)
    editSelected((hex) => {
      hex.hexType = e.target.value
    })
})
$("#label").addEventListener("input", (e) =>
  editSelected((hex) => {
    if (e.target.value) hex.label = e.target.value
    else delete hex.label
  }),
)
$("#link").addEventListener("input", (e) =>
  editSelected((hex) => {
    if (e.target.value) hex.link = e.target.value
    else delete hex.link
  }),
)
for (const selector of ["#q", "#r"])
  $(selector).addEventListener("change", () => {
    const hex = selectedHex()
    if (!hex) return
    const q = selector === "#q" ? Number($("#q").value) : hex.q,
      r = selector === "#r" ? Number($("#r").value) : hex.r
    if (state.map.hexes.some((item) => item !== hex && item.q === q && item.r === r)) {
      notify("Those coordinates are already occupied")
      syncControls()
      return
    }
    hex.q = q
    hex.r = r
    state.selected = new Set([key(hex)])
    updateSource()
  })
function addHex(q, r) {
  if (!state.map.hexes.some((hex) => hex.q === q && hex.r === r)) {
    const hex = { q, r, hexType: "deep-ocean" }
    state.map.hexes.push(hex)
    state.selected = new Set([key(hex)])
    updateSource()
    return true
  }
  return false
}
function paintHexAt(clientX, clientY) {
  const hex = hexAtPoint(clientX, clientY)
  if (!hex) return false
  const bounds = $(".canvas-wrap").getBoundingClientRect()
  if (
    clientX < bounds.left ||
    clientX >= bounds.right ||
    clientY < bounds.top ||
    clientY >= bounds.bottom
  )
    return false
  const hexKey = `${hex.q},${hex.r}`
  if (hexKey === state.lastPainted) return false
  state.lastPainted = hexKey
  if (state.map.hexes.some((item) => key(item) === hexKey)) return false
  state.dragged = true
  state.suppressMapClick = true
  const size = Math.max(1, Number(state.map.settings.hexSize) || 30)
  const { x, y } = center(hex.q, hex.r, size, state.map.settings.orientation)
  const angle = state.map.settings.orientation === "flat" ? 0 : -30
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i + angle)
    return `${(x + size * Math.cos(a)).toFixed(2)},${(y + size * Math.sin(a)).toFixed(2)}`
  }).join(" ")
  const tile = svgElement("g", {
    class: "tile",
    tabindex: 0,
    role: "button",
    "aria-label": `Hex ${hex.q}, ${hex.r}, deep-ocean`,
    "data-key": hexKey,
  })
  tile.append(
    svgElement("polygon", {
      points,
      fill: terrains["deep-ocean"],
      stroke: state.map.settings.showGrid === false ? "none" : "#d5c9a866",
      "stroke-width": 1.5,
    }),
  )
  // Keep the viewBox fixed until the stroke ends so the grid stays under the pointer.
  const svg = $("#map")
  if (!svg.firstElementChild) svg.append(svgElement("g"))
  svg.firstElementChild.append(tile)
  $("#empty").classList.add("hidden")
  state.map.hexes.push({ ...hex, hexType: "deep-ocean" })
  state.selected = new Set([hexKey])
  return true
}
function rebaseCoordinates() {
  const hexes = state.map.hexes
  const minQ = Math.min(...hexes.map((hex) => hex.q)),
    minR = Math.min(...hexes.map((hex) => hex.r))
  const orientation = state.map.settings.orientation === "flat" ? "flat" : "pointy"
  const qShift = minQ < 0 ? (orientation === "flat" ? Math.ceil(-minQ / 2) * 2 : -minQ) : 0
  const rShift = minR < 0 ? (orientation === "pointy" ? Math.ceil(-minR / 2) * 2 : -minR) : 0
  if (!qShift && !rShift) return
  for (const hex of hexes) {
    hex.q += qShift
    hex.r += rShift
  }
  state.selected = new Set(
    [...state.selected].map((coordinate) => {
      const [q, r] = coordinate.split(",").map(Number)
      return `${q + qShift},${r + rShift}`
    }),
  )
}
function addHexAboveMap() {
  const hexes = state.map.hexes
  if (!hexes.length) {
    addHex(0, 0)
    return
  }
  const orientation = state.map.settings.orientation === "flat" ? "flat" : "pointy"
  const size = Number(state.map.settings.hexSize) || 30
  const occupied = new Set(hexes.map(key)),
    candidates = new Map()
  for (const hex of hexes) {
    for (let dq = -1; dq <= 1; dq++)
      for (let dr = -1; dr <= 1; dr++) {
        if (!dq && !dr) continue
        const q = hex.q + dq,
          r = hex.r + dr,
          candidateKey = `${q},${r}`
        if (occupied.has(candidateKey)) continue
        const position = center(q, r, size, orientation)
        if (
          Math.hypot(
            position.x - center(hex.q, hex.r, size, orientation).x,
            position.y - center(hex.q, hex.r, size, orientation).y,
          ) <
          size * 1.75
        )
          candidates.set(candidateKey, { q, r, ...position })
      }
  }
  const topY = Math.min(...hexes.map((hex) => center(hex.q, hex.r, size, orientation).y))
  const middleX =
    (Math.min(...hexes.map((hex) => center(hex.q, hex.r, size, orientation).x)) +
      Math.max(...hexes.map((hex) => center(hex.q, hex.r, size, orientation).x))) /
    2
  const above = [...candidates.values()]
    .filter((candidate) => candidate.y < topY)
    .sort((a, b) => a.y - b.y || Math.abs(a.x - middleX) - Math.abs(b.x - middleX))
  if (!above.length) return
  const { q, r } = above[0]
  const hex = { q, r, hexType: "deep-ocean" }
  hexes.push(hex)
  state.selected = new Set([key(hex)])
  rebaseCoordinates()
  updateSource()
}
$("#add").addEventListener("click", () => {
  if (!state.map) {
    state.map = defaultMap()
    source.value = toFrontmatter(state.map)
  }
  addHexAboveMap()
})
$("#delete").addEventListener("click", () => {
  if (!state.selected.size) return
  state.map.hexes = state.map.hexes.filter((hex) => !state.selected.has(key(hex)))
  state.selected.clear()
  updateSource()
})
$("#clear").addEventListener("click", () => {
  if (state.map && confirm("Remove every hex from this map?")) {
    state.map.hexes = []
    state.selected.clear()
    updateSource()
  }
})
$("#map").addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !state.map || state.dragging) return
  state.pointerId = event.pointerId
  state.suppressMapClick = false
  $("#map").setPointerCapture(event.pointerId)
  const tile = event.target.closest(".tile")
  if (tile) {
    event.preventDefault()
    state.painting = false
    state.dragging = true
    state.dragged = false
    state.selected = new Set([tile.dataset.key])
    return
  }
  const hex = hexAtPoint(event.clientX, event.clientY)
  if (!hex) return
  event.preventDefault()
  state.painting = true
  state.dragging = true
  state.dragged = false
  state.lastPainted = null
  state.lastPointer = { x: event.clientX, y: event.clientY }
  state.suppressMapClick = false
  if (!paintHexAt(event.clientX, event.clientY)) {
    state.painting = false
    state.dragging = false
  }
})
document.addEventListener("pointermove", (event) => {
  if (!state.dragging || event.pointerId !== state.pointerId) return
  if (state.painting) {
    const previous = state.lastPointer
    const dx = event.clientX - previous.x,
      dy = event.clientY - previous.y
    const matrix = $("#map").getScreenCTM()
    const size = Math.max(1, Number(state.map.settings.hexSize) || 30)
    const step = Math.max(1, (size * Math.hypot(matrix.a, matrix.b)) / 3)
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step))
    for (let i = 1; i <= steps; i++)
      paintHexAt(previous.x + (dx * i) / steps, previous.y + (dy * i) / steps)
    state.lastPointer = { x: event.clientX, y: event.clientY }
    return
  }
  const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest(".tile")
  if (tile && !state.selected.has(tile.dataset.key)) {
    state.dragged = true
    state.selected.add(tile.dataset.key)
    for (const selectedTile of $("#map").querySelectorAll(".tile"))
      selectedTile.classList.toggle("selected", state.selected.has(selectedTile.dataset.key))
  }
})
function finishPointerAction(event) {
  if (!state.dragging || (event.pointerId != null && event.pointerId !== state.pointerId)) return
  state.dragging = false
  state.suppressMapClick = true
  if (state.painting) {
    state.painting = false
    state.lastPainted = null
    state.lastPointer = null
    updateSource()
    return
  }
  render()
}
document.addEventListener("pointerup", finishPointerAction)
document.addEventListener("pointercancel", finishPointerAction)
$("#map").addEventListener("lostpointercapture", finishPointerAction)
window.addEventListener("blur", finishPointerAction)
$("#map").addEventListener("click", (event) => {
  if (!state.map) return
  if (state.suppressMapClick) {
    state.suppressMapClick = false
    return
  }
  if (event.button !== 0 || event.target.closest(".tile")) return
  const hex = hexAtPoint(event.clientX, event.clientY)
  if (hex) {
    if (addHex(hex.q, hex.r)) return
    const existing = state.map.hexes.find((item) => item.q === hex.q && item.r === hex.r)
    state.selected = new Set([key(existing)])
    syncControls()
    render()
  }
})
$("#zoom-in").addEventListener("click", () => setZoom(state.zoom + 0.15))
$("#zoom-out").addEventListener("click", () => setZoom(state.zoom - 0.15))
$("#fit").addEventListener("click", () => setZoom(1))
function setZoom(value) {
  state.zoom = Math.min(1.8, Math.max(0.5, value))
  $("#zoom-label").textContent = `${Math.round(state.zoom * 100)}%`
  render()
}
let toastTimer
function notify(message) {
  const toast = $("#toast")
  toast.textContent = message
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800)
}
$("#copy").addEventListener("click", async () => {
  if (!state.map) {
    notify("Fix the frontmatter errors before copying")
    return
  }
  try {
    await navigator.clipboard.writeText(toFrontmatter(state.map))
  } catch {
    source.focus()
    source.select()
    document.execCommand("copy")
  }
  notify("Frontmatter copied — ready to paste into your Quartz page")
})
