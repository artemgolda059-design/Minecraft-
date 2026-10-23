import './style.css'
import * as THREE from 'three'

const CHUNK_SIZE = 32
const CHUNK_RADIUS = 2
const WORLD_SIZE = CHUNK_SIZE * (CHUNK_RADIUS * 2 + 1)
const WORLD_MIN = -Math.floor(WORLD_SIZE / 2)
const SAVE_KEY = 'lisosvit-world-v1'
const BLOCKS = ['grass', 'dirt', 'stone', 'wood', 'leaves', 'sand', 'brick', 'flower']
const BLOCK_LABELS = {
  grass: 'Трава', dirt: 'Земля', stone: 'Камінь', wood: 'Деревина',
  leaves: 'Листя', sand: 'Пісок', brick: 'Цегла', flower: 'Квітка',
}
const BLOCK_COLORS = {
  grass: '#79a94c', dirt: '#92613e', stone: '#8d9690', wood: '#a77343',
  leaves: '#528a45', sand: '#d6bf7c', brick: '#a95644', flower: '#d889ad',
}
const app = document.querySelector('#app')
app.classList.add('is-menu')

app.innerHTML = `
  <canvas id="world-canvas" aria-label="Ігровий світ"></canvas>
  <main id="menu-screen" class="menu-screen">
    <header class="brand-row"><div class="brand-mark"><i></i><i></i><i></i><i></i></div><span>ЛІСОСВІТ</span><span class="brand-caption">світ, який росте разом з тобою</span></header>
    <section class="menu-copy">
      <p class="eyebrow"><span class="live-dot"></span> ТВОЯ ПРИГОДА ПОЧИНАЄТЬСЯ ТУТ</p>
      <h1>Створи<br><em>свій світ.</em></h1>
      <p class="menu-lede">Будуй, досліджуй і знаходь маленькі дива за кожним пагорбом.</p>
      <div class="menu-actions">
        <button class="button button-primary" id="play-button"><span class="button-icon">▶</span><span id="play-label">Грати</span><span class="button-arrow">↗</span></button>
        <button class="button button-secondary" id="skins-button"><span class="button-icon">◈</span> Обрати образ</button>
      </div>
      <div id="resume-note" class="resume-note" hidden></div>
    </section>
    <div class="menu-bottom"><span>ТИХА ДОЛИНА · 01</span><span>WASD РУХ · E КРАФТ · ESC МЕНЮ</span></div>
    <section id="create-panel" class="modal-panel" hidden>
      <button class="icon-button modal-close" data-close="create-panel" aria-label="Закрити">×</button>
      <p class="eyebrow">НОВА ПРИГОДА</p><h2>Створити світ</h2>
      <label class="field-label" for="world-name">Назва світу</label>
      <input id="world-name" class="text-field" maxlength="24" value="Тиха долина" autocomplete="off">
      <span class="field-label">Режим гри</span>
      <div class="mode-switch" role="group" aria-label="Режим гри">
        <button class="mode-option is-selected" data-mode="survival"><b>Виживання</b><small>Збирай ресурси й бережи сили</small></button>
        <button class="mode-option" data-mode="creative"><b>Творчий</b><small>Будуй без обмежень</small></button>
      </div>
      <p id="world-create-error" class="world-create-error" role="alert" hidden></p>
      <div class="modal-actions"><button id="resume-button" class="button button-secondary" hidden>Продовжити збережений світ</button><button id="create-world-button" class="button button-primary">Створити світ <span class="button-arrow">↗</span></button></div>
    </section>
    <section id="skins-panel" class="modal-panel skin-panel" hidden>
      <button class="icon-button modal-close" data-close="skins-panel" aria-label="Закрити">×</button>
      <p class="eyebrow">ТВІЙ ПЕРСОНАЖ</p><h2>Обери образ</h2>
      <div class="skin-options">
        <button class="skin-option is-selected" data-skin="boy"><span class="skin-avatar avatar-boy"><i class="avatar-hair"></i><i class="avatar-face"></i><i class="avatar-shirt"></i><i class="avatar-legs"></i></span><b>Мандрівник</b><small>Зелена куртка</small></button>
        <button class="skin-option" data-skin="girl"><span class="skin-avatar avatar-girl"><i class="avatar-hair"></i><i class="avatar-face"></i><i class="avatar-shirt"></i><i class="avatar-legs"></i></span><b>Дослідниця</b><small>Рожева накидка</small></button>
      </div>
      <button class="button button-primary skin-done" data-close="skins-panel">Готово <span class="button-arrow">↗</span></button>
    </section>
  </main>

  <section id="game-ui" class="game-ui" hidden>
    <header class="game-topbar">
      <div class="world-chip"><span class="world-dot"></span><div><b id="hud-world-name">Тиха долина</b><small id="hud-world-state">ВИЖИВАННЯ · ДЕНЬ 1</small></div></div>
      <div class="top-actions">
        <button class="hud-button weather-button" id="weather-button" title="Змінити погоду"><span>☀</span><b>Ясно</b></button>
        <button class="hud-button" id="time-button" title="Змінити день і ніч"><span>☾</span><b>Ніч</b></button>
        <button class="hud-button" id="craft-button" title="Відкрити крафт"><span>⌘</span><b>Крафт</b></button>
        <button class="hud-button icon-hud" id="pause-button" title="Меню"><span>Ⅱ</span></button>
      </div>
    </header>
    <div class="game-vitals" id="game-vitals"><span>♥ ♥ ♥ ♥ ♥</span><small id="health-label">100</small></div>
    <div class="crosshair" id="crosshair"><i></i><b></b></div>
    <div class="target-label" id="target-label"></div>
    <div class="mine-progress" id="mine-progress"><i></i></div>
    <div id="hotbar" class="hotbar" aria-label="Панель предметів"></div>
    <div class="hotbar-caption"><span id="selected-label">Трава</span><span id="inventory-count">∞</span></div>
    <div class="game-hint" id="game-hint">Клацни по блоку, щоб зламати <kbd>E</kbd> крафт</div>
    <div id="touch-controls" class="touch-controls">
      <div class="joystick" id="joystick"><span class="joystick-knob" id="joystick-knob"></span></div>
      <div class="touch-actions"><button id="jump-button" class="touch-action" aria-label="Стрибок">↑</button><button id="mine-button" class="touch-action" aria-label="Зламати блок">⛏</button><button id="place-button" class="touch-action" aria-label="Поставити блок">▧</button></div>
    </div>
    <section id="craft-panel" class="game-modal" hidden><div class="game-modal-head"><div><p class="eyebrow">МАЙСТЕРНЯ</p><h2>Крафт</h2></div><button class="icon-button" data-close="craft-panel" aria-label="Закрити">×</button></div><div id="recipe-list" class="recipe-list"></div></section>
    <section id="pause-panel" class="game-modal pause-panel" hidden><div class="game-modal-head"><div><p class="eyebrow">ПРИГОДУ ПРИЗУПИНЕНО</p><h2 id="pause-title">Тиха долина</h2></div><button class="icon-button" data-close="pause-panel" aria-label="Продовжити">×</button></div><p class="pause-copy">Світ автоматично збережеться, коли ти вийдеш.</p><div class="pause-actions"><button class="button button-primary" id="continue-button">Продовжити</button><button class="button button-secondary" id="save-exit-button">Зберегти й вийти</button></div></section>
    <div id="toast" class="toast" role="status"></div>
  </section>
`

const canvas = document.querySelector('#world-canvas')
const menuScreen = document.querySelector('#menu-screen')
const gameUI = document.querySelector('#game-ui')
const createPanel = document.querySelector('#create-panel')
const skinsPanel = document.querySelector('#skins-panel')
const craftPanel = document.querySelector('#craft-panel')
const pausePanel = document.querySelector('#pause-panel')
const hotbar = document.querySelector('#hotbar')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500)
scene.add(camera)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.12
scene.background = new THREE.Color('#9acbe1')
scene.fog = new THREE.Fog('#9acbe1', 38, 155)

const ambient = new THREE.HemisphereLight('#fff4d2', '#4e7057', 2.1)
scene.add(ambient)
const sun = new THREE.DirectionalLight('#fff2cf', 3.1)
sun.position.set(-36, 60, 28)
scene.add(sun)
const raycaster = new THREE.Raycaster()
const center = new THREE.Vector2(0, 0)
const worldRoot = new THREE.Group()
scene.add(worldRoot)
const blockMeshes = []
const blockMap = new Map()
const topHeights = new Map()
const chunkMeshes = new Map()
const textureMaterials = {}
const pixelMaterialCache = new Map()
const tempObject = new THREE.Object3D()

const game = {
  active: false,
  seed: 3721,
  name: 'Тиха долина',
  mode: 'survival',
  skin: 'boy',
  weather: 'clear',
  dayTime: 0.23,
  player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0.22, verticalSpeed: 0 },
  inventory: { grass: 32, dirt: 12, stone: 10, wood: 8, leaves: 5, sand: 0, brick: 0, flower: 0, sticks: 2, planks: 0, leather: 8, pickaxe: 0, sword: 0, helmet: 0, chestplate: 0 },
  edits: new Map(),
  selected: 0,
  health: 100,
  lastSaved: 0,
}
let playerModel
let armModel
let animalModels = []
let plantMeshes = []
let rainMesh
let rainPositions
let isNight = false
let miningTimer = 0
let miningTarget = null
let dragState = null
let toastTimer = 0
let lastFrame = performance.now()
let elapsed = 0
let jumpRequested = false
let touchVector = { x: 0, y: 0 }
let moveKeys = { forward: false, back: false, left: false, right: false }

function keyOf(x, y, z) { return `${x},${y},${z}` }
function unpackKey(key) { return key.split(',').map(Number) }
function randomAt(x, z, seed = game.seed) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 0.173) * 43758.5453
  return value - Math.floor(value)
}
function terrainHeight(x, z) {
  const rolling = Math.sin(x * 0.105 + game.seed * 0.01) * 1.2 + Math.cos(z * 0.09 - game.seed * 0.02) * 1.1
  return Math.max(2, 3 + Math.round(rolling + (randomAt(x, z) - 0.5) * 1.4))
}
function chunkCoords(x, z) {
  return [Math.floor((x - WORLD_MIN) / CHUNK_SIZE), Math.floor((z - WORLD_MIN) / CHUNK_SIZE)]
}

function makeTexture(type, face) {
  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = 64
  textureCanvas.height = 64
  const context = textureCanvas.getContext('2d')
  const base = BLOCK_COLORS[type] || '#aabb88'
  context.fillStyle = base
  context.fillRect(0, 0, 64, 64)
  if (type === 'grass' && face === 'side') {
    context.fillStyle = '#75ac48'
    context.fillRect(0, 0, 64, 12)
    context.fillStyle = '#58843b'
    for (let x = 2; x < 64; x += 8) context.fillRect(x, 8, 3, 6 + Math.floor(randomAt(x, 5) * 9))
    context.fillStyle = '#8f643c'
    context.fillRect(0, 14, 64, 50)
  }
  if (type === 'grass' && face === 'bottom') context.fillStyle = '#79543a', context.fillRect(0, 0, 64, 64)
  if (type === 'wood') {
    context.fillStyle = '#704629'
    for (let x = 6; x < 64; x += 16) context.fillRect(x, 0, 3, 64)
    if (face === 'top' || face === 'bottom') {
      context.fillStyle = '#d0a36a'
      context.fillRect(8, 8, 48, 48)
      context.fillStyle = '#8e6038'
      context.fillRect(15, 15, 34, 34)
      context.fillStyle = '#d0a36a'
      context.fillRect(22, 22, 20, 20)
    }
  }
  if (type === 'brick') {
    context.fillStyle = '#d0ad91'
    for (let y = 0; y < 64; y += 16) context.fillRect(0, y, 64, 2)
    for (let y = 0; y < 64; y += 32) for (let x = 0; x < 64; x += 32) context.fillRect(x, y, 2, 16)
    for (let y = 16; y < 64; y += 32) for (let x = 16; x < 64; x += 32) context.fillRect(x, y, 2, 16)
  }
  if (type === 'flower') {
    context.fillStyle = '#d99ab7'
    context.fillRect(0, 0, 64, 64)
    context.fillStyle = '#f2c9d8'
    context.fillRect(9, 9, 8, 8); context.fillRect(45, 13, 7, 7); context.fillRect(28, 40, 9, 9)
    context.fillStyle = '#e9ba5b'
    context.fillRect(12, 13, 3, 3); context.fillRect(47, 15, 3, 3); context.fillRect(31, 43, 3, 3)
  }
  if (type === 'leaves') {
    context.fillStyle = '#73a957'
    for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y += 8) {
      if (randomAt(x + 13, y + 27) > 0.18) {
        context.fillStyle = randomAt(x, y + 8) > 0.5 ? '#62984d' : '#83b765'
        context.fillRect(x + 1, y + 1, 6, 6)
      }
    }
  }
  if (type !== 'wood' && type !== 'brick' && type !== 'flower' && type !== 'leaves' && !(type === 'grass' && face !== 'top')) {
    const colors = type === 'stone' ? ['#a9b0aa', '#747d78', '#949b96'] : type === 'sand' ? ['#e6d193', '#b9a569', '#d8c07d'] : ['#a77750', '#805536', '#9a6945']
    for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y += 8) {
      if (randomAt(x + 41, y + 7) > 0.42) {
        context.fillStyle = colors[Math.floor(randomAt(x, y + 91) * colors.length)]
        context.fillRect(x + 1, y + 1, 5, 5)
      }
    }
  }
  const texture = new THREE.CanvasTexture(textureCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapNearestFilter
  texture.generateMipmaps = true
  return texture
}

function makePixelMaterial(color, accent) {
  const cacheKey = `${color}:${accent}`
  if (pixelMaterialCache.has(cacheKey)) return pixelMaterialCache.get(cacheKey)
  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = 32
  textureCanvas.height = 32
  const context = textureCanvas.getContext('2d')
  context.fillStyle = color
  context.fillRect(0, 0, 32, 32)
  for (let x = 0; x < 32; x += 4) for (let y = 0; y < 32; y += 4) {
    const chance = randomAt(x + color.charCodeAt(1), y + color.charCodeAt(4), color.charCodeAt(3))
    if (chance > 0.52) {
      context.fillStyle = accent
      context.fillRect(x, y, 2 + Math.floor(chance * 2), 2 + Math.floor(chance * 2))
    }
  }
  context.fillStyle = 'rgba(255,255,255,0.14)'
  context.fillRect(0, 0, 32, 2)
  const texture = new THREE.CanvasTexture(textureCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapNearestFilter
  texture.generateMipmaps = true
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 })
  pixelMaterialCache.set(cacheKey, material)
  return material
}

for (const type of BLOCKS) {
  textureMaterials[type] = {}
  for (const face of ['side', 'top', 'bottom']) {
    textureMaterials[type][face] = new THREE.MeshStandardMaterial({
      map: makeTexture(type, face), roughness: type === 'sand' ? 1 : 0.84,
      transparent: type === 'leaves', alphaTest: type === 'leaves' ? 0.22 : 0,
    })
  }
}

const FACE_DEFINITIONS = [
  { side: 'top', normal: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { side: 'bottom', normal: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { side: 'side', normal: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { side: 'side', normal: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { side: 'side', normal: [0, 0, 1], corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { side: 'side', normal: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
]

function disposeChunk(cx, cz) {
  const chunkKey = `${cx},${cz}`
  for (const mesh of chunkMeshes.get(chunkKey) || []) {
    worldRoot.remove(mesh)
    const index = blockMeshes.indexOf(mesh)
    if (index !== -1) blockMeshes.splice(index, 1)
    mesh.geometry.dispose()
  }
  chunkMeshes.delete(chunkKey)
}

function buildChunk(cx, cz) {
  disposeChunk(cx, cz)
  const bucketMap = new Map()
  const xStart = WORLD_MIN + cx * CHUNK_SIZE
  const zStart = WORLD_MIN + cz * CHUNK_SIZE
  for (let x = xStart; x < xStart + CHUNK_SIZE; x += 1) {
    for (let z = zStart; z < zStart + CHUNK_SIZE; z += 1) {
      for (let y = 0; y <= 20; y += 1) {
        const block = blockMap.get(keyOf(x, y, z))
        if (!block) continue
        for (const face of FACE_DEFINITIONS) {
          const [nx, ny, nz] = face.normal
          const neighbor = blockMap.get(keyOf(x + nx, y + ny, z + nz))
          if (neighbor && !(block.type === 'leaves' && neighbor.type !== 'leaves')) continue
          const bucketKey = `${block.type}:${face.side}`
          if (!bucketMap.has(bucketKey)) bucketMap.set(bucketKey, { type: block.type, side: face.side, positions: [], uvs: [], indices: [], faceMap: [] })
          const bucket = bucketMap.get(bucketKey)
          const baseIndex = bucket.positions.length / 3
          for (let vertex = 0; vertex < 4; vertex += 1) {
            const corner = face.corners[vertex]
            bucket.positions.push(x + corner[0], y + corner[1], z + corner[2])
            bucket.uvs.push(vertex === 1 || vertex === 2 ? 1 : 0, vertex === 2 || vertex === 3 ? 1 : 0)
          }
          bucket.indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3)
          const blockKey = keyOf(x, y, z)
          bucket.faceMap.push(blockKey, blockKey)
        }
      }
    }
  }
  const meshes = []
  for (const bucket of bucketMap.values()) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(bucket.positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uvs, 2))
    geometry.setIndex(bucket.indices)
    geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, textureMaterials[bucket.type][bucket.side])
    mesh.userData.faceMap = bucket.faceMap
    mesh.userData.blockType = bucket.type
    mesh.frustumCulled = true
    worldRoot.add(mesh)
    blockMeshes.push(mesh)
    meshes.push(mesh)
  }
  chunkMeshes.set(`${cx},${cz}`, meshes)
}

function rebuildNear(x, z) {
  const [cx, cz] = chunkCoords(x, z)
  for (let dx = -1; dx <= 1; dx += 1) for (let dz = -1; dz <= 1; dz += 1) {
    const nextX = cx + dx
    const nextZ = cz + dz
    if (nextX >= 0 && nextX < CHUNK_RADIUS * 2 + 1 && nextZ >= 0 && nextZ < CHUNK_RADIUS * 2 + 1) buildChunk(nextX, nextZ)
  }
}

function nextFrame() { return new Promise((resolve) => requestAnimationFrame(resolve)) }

async function createGround(seed, onProgress = () => {}) {
  game.seed = seed
  blockMap.clear()
  topHeights.clear()
  for (let x = WORLD_MIN; x < WORLD_MIN + WORLD_SIZE; x += 1) {
    for (let z = WORLD_MIN; z < WORLD_MIN + WORLD_SIZE; z += 1) {
      const height = terrainHeight(x, z)
      topHeights.set(`${x},${z}`, height)
      for (let y = 0; y <= height; y += 1) {
        const type = y === height ? (height < 3 ? 'sand' : 'grass') : y >= height - 2 ? 'dirt' : 'stone'
        blockMap.set(keyOf(x, y, z), { type })
      }
    }
    if ((x - WORLD_MIN) % 8 === 0) {
      onProgress(`Генеруємо ландшафт ${Math.round((x - WORLD_MIN) / WORLD_SIZE * 35)}%`)
      await nextFrame()
    }
  }
  for (let x = WORLD_MIN + 4; x < WORLD_MIN + WORLD_SIZE - 4; x += 1) {
    for (let z = WORLD_MIN + 4; z < WORLD_MIN + WORLD_SIZE - 4; z += 1) {
      if (randomAt(x + 29, z + 71) > 0.993) addTree(x, z)
    }
  }
  for (const [key, type] of game.edits) {
    if (type === null) blockMap.delete(key)
    else blockMap.set(key, { type })
  }
  const chunkCount = (CHUNK_RADIUS * 2 + 1) ** 2
  let builtChunks = 0
  for (let cz = 0; cz < CHUNK_RADIUS * 2 + 1; cz += 1) for (let cx = 0; cx < CHUNK_RADIUS * 2 + 1; cx += 1) {
    buildChunk(cx, cz)
    builtChunks += 1
    onProgress(`Створюємо чанки ${builtChunks}/${chunkCount}`)
    await nextFrame()
  }
  createPlants()
  createAnimals()
  updateSky()
}

function addTree(x, z) {
  const base = topHeights.get(`${x},${z}`)
  if (base === undefined || blockMap.get(keyOf(x, base, z))?.type !== 'grass') return
  const trunkHeight = 5 + Math.floor(randomAt(x + 19, z + 43) * 3)
  for (let y = 1; y <= trunkHeight; y += 1) blockMap.set(keyOf(x, base + y, z), { type: 'wood' })
  for (let dx = -2; dx <= 2; dx += 1) for (let dz = -2; dz <= 2; dz += 1) {
    for (let dy = trunkHeight - 2; dy <= trunkHeight + 2; dy += 1) {
      if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - trunkHeight) > 5) continue
      const key = keyOf(x + dx, base + dy, z + dz)
      if (!blockMap.has(key)) blockMap.set(key, { type: 'leaves' })
    }
  }
  blockMap.set(keyOf(x, base + trunkHeight + 2, z), { type: 'leaves' })
}

function createPlants() {
  for (const plant of plantMeshes) { worldRoot.remove(plant); plant.geometry.dispose() }
  plantMeshes = []
  const grassGeometry = new THREE.ConeGeometry(0.11, 0.38, 4)
  const grassMaterial = makePixelMaterial('#82a954', '#b1c875')
  const flowerStemGeometry = new THREE.CylinderGeometry(0.018, 0.025, 0.25, 4)
  const flowerGeometry = new THREE.SphereGeometry(0.105, 6, 5)
  const yellowMaterial = makePixelMaterial('#f1c85c', '#fff0ad')
  const pinkMaterial = makePixelMaterial('#e68eae', '#ffd2de')
  const bushGeometry = new THREE.DodecahedronGeometry(0.34, 0)
  const bushMaterial = makePixelMaterial('#528446', '#83ad59')
  const rockGeometry = new THREE.DodecahedronGeometry(0.28, 0)
  const rockMaterial = makePixelMaterial('#8f9994', '#c0c5b8')
  const mushroomStemGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.2, 5)
  const mushroomCapGeometry = new THREE.SphereGeometry(0.17, 6, 4)
  const mushroomStemMaterial = makePixelMaterial('#e8ddc5', '#fff8e4')
  const mushroomCapMaterial = makePixelMaterial('#c85c47', '#f1a36f')
  const instances = Object.fromEntries(['grass', 'yellow', 'pink', 'stem', 'bush', 'rock', 'mushroomStem', 'mushroomCap'].map((name) => [name, []]))
  const addInstance = (bucket, x, y, z, sx, sy, sz, rotation = 0) => {
    tempObject.position.set(x, y, z)
    tempObject.rotation.set(0, rotation, 0)
    tempObject.scale.set(sx, sy, sz)
    tempObject.updateMatrix()
    instances[bucket].push(tempObject.matrix.clone())
  }
  for (let x = WORLD_MIN + 2; x < WORLD_MIN + WORLD_SIZE - 2; x += 1) {
    for (let z = WORLD_MIN + 2; z < WORLD_MIN + WORLD_SIZE - 2; z += 1) {
      const chance = randomAt(x + 101, z + 309)
      if (chance < 0.44) continue
      const y = topHeights.get(`${x},${z}`) + 1
      if (blockMap.get(keyOf(x, y - 1, z))?.type !== 'grass') continue
      const px = x + 0.28 + randomAt(x, z + 102) * 0.44
      const pz = z + 0.28 + randomAt(x + 84, z) * 0.44
      const kind = randomAt(x + 71, z + 6)
      const rotation = randomAt(x + 22, z + 91) * Math.PI
      if (kind < 0.07) {
        addInstance(instances.mushroomStem, px, y + 0.1, pz, 1, 1, 1, rotation)
        addInstance(instances.mushroomCap, px, y + 0.23, pz, 1, 0.72, 1, rotation)
      } else if (kind < 0.17) {
        addInstance(instances.bush, px, y + 0.13, pz, 0.72 + chance * 0.25, 0.65 + chance * 0.25, 0.72 + chance * 0.25, rotation)
      } else if (kind < 0.29) {
        addInstance(instances.rock, px, y + 0.11, pz, 0.75 + chance * 0.35, 0.52 + chance * 0.2, 0.82 + chance * 0.22, rotation)
      } else if (kind < 0.48) {
        addInstance(instances.stem, px, y + 0.12, pz, 1, 1, 1, rotation)
        addInstance(randomAt(x + 101, z + 39) > 0.5 ? instances.yellow : instances.pink, px, y + 0.29, pz, 1, 1, 1, rotation)
      } else {
        addInstance(instances.grass, px, y + 0.17, pz, 0.8 + chance * 0.4, 0.82 + chance * 0.65, 0.8 + chance * 0.4, rotation)
      }
    }
  }
  const addInstances = (geometry, material, matrices) => {
    if (!matrices.length) return
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.instanceMatrix.needsUpdate = true
    worldRoot.add(mesh)
    plantMeshes.push(mesh)
  }
  addInstances(grassGeometry, grassMaterial, instances.grass)
  addInstances(flowerStemGeometry, makePixelMaterial('#547d3f', '#94b457'), instances.stem)
  addInstances(flowerGeometry, yellowMaterial, instances.yellow)
  addInstances(flowerGeometry, pinkMaterial, instances.pink)
  addInstances(bushGeometry, bushMaterial, instances.bush)
  addInstances(rockGeometry, rockMaterial, instances.rock)
  addInstances(mushroomStemGeometry, mushroomStemMaterial, instances.mushroomStem)
  addInstances(mushroomCapGeometry, mushroomCapMaterial, instances.mushroomCap)
}

function makeAnimal(kind, x, z) {
  const group = new THREE.Group()
  const isCow = kind === 'cow'
  const colors = isCow ? { body: '#f0eee0', patch: '#5a4338', face: '#e3b6a2' } : { body: '#e48f86', patch: '#d67470', face: '#f0b5a7' }
  const bodyMaterial = makePixelMaterial(colors.body, isCow ? '#d2cbb6' : '#f0b0a2')
  const patchMaterial = makePixelMaterial(colors.patch, '#99755c')
  const faceMaterial = makePixelMaterial(colors.face, '#f5d2b2')
  const darkMaterial = makePixelMaterial('#42352c', '#75604a')
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.64, 0.52), bodyMaterial)
  body.position.set(0, 0.62, 0)
  group.add(body)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.43, 0.44), faceMaterial)
  head.position.set(0, 0.88, -0.45)
  group.add(head)
  if (isCow) {
    for (const [px, pz] of [[-0.2, -0.12], [0.22, 0.13]]) {
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.28, 0.04), patchMaterial)
      patch.position.set(px, 0.67, pz)
      group.add(patch)
    }
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), new THREE.MeshStandardMaterial({ color: '#e5d6ad' }))
      horn.position.set(side * 0.16, 1.15, -0.42)
      group.add(horn)
    }
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.035), darkMaterial)
    eye.position.set(side * 0.13, 0.94, -0.68)
    group.add(eye)
  }
  const legs = []
  for (const lx of [-0.29, 0.29]) for (const lz of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.17), bodyMaterial)
    leg.position.set(lx, 0.22, lz)
    group.add(leg)
    legs.push(leg)
  }
  group.position.set(x, topHeights.get(`${Math.round(x)},${Math.round(z)}`) + 1, z)
  group.userData = { kind, legs, direction: randomAt(x + 8, z + 17) * Math.PI * 2, pace: 0.38 + randomAt(x + 98, z + 4) * 0.27, step: randomAt(x + 42, z + 38) * 6 }
  worldRoot.add(group)
  return group
}

function createAnimals() {
  for (const animal of animalModels) worldRoot.remove(animal)
  animalModels = []
  const choices = [[-11, -7, 'cow'], [8, -11, 'pig'], [12, 5, 'cow'], [-8, 12, 'pig'], [2, 17, 'cow'], [19, -1, 'pig']]
  for (const [x, z, kind] of choices) animalModels.push(makeAnimal(kind, x, z))
}

function makeCharacter(skin) {
  const group = new THREE.Group()
  const palette = skin === 'girl'
    ? { hair: '#553a43', skin: '#efc6a6', shirt: '#bf7186', pants: '#4e6978', shoes: '#644b40' }
    : { hair: '#6a4b34', skin: '#efc6a6', shirt: '#638a58', pants: '#4c6870', shoes: '#4f4437' }
  const accents = {
    [palette.hair]: skin === 'girl' ? '#91616a' : '#96744b',
    [palette.skin]: '#f8dfbd',
    [palette.shirt]: skin === 'girl' ? '#e2a3a9' : '#a8bd77',
    [palette.pants]: '#819392',
    [palette.shoes]: '#8e7358',
    '#413b36': '#837264',
  }
  const mat = (color) => makePixelMaterial(color, accents[color] || '#b6b5a3')
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.58), mat(palette.skin))
  head.position.y = 2.12
  group.add(head)
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.62, skin === 'girl' ? 0.25 : 0.18, 0.62), mat(palette.hair))
  hair.position.set(0, 2.46, 0.015)
  group.add(hair)
  if (skin === 'girl') {
    for (const side of [-1, 1]) {
      const braid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.16), mat(palette.hair))
      braid.position.set(side * 0.31, 2.17, 0.04)
      group.add(braid)
    }
  }
  const eyes = mat('#413b36')
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.035), eyes)
    eye.position.set(side * 0.14, 2.15, -0.3)
    group.add(eye)
  }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.84, 0.38), mat(palette.shirt))
  torso.position.y = 1.38
  group.add(torso)
  const legs = []
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.7, 0.34), mat(palette.pants))
    leg.position.set(side * 0.18, 0.58, 0)
    group.add(leg)
    legs.push(leg)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.17, 0.43), mat(palette.shoes))
    shoe.position.set(side * 0.18, 0.13, -0.05)
    group.add(shoe)
  }
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.3), mat(palette.shirt))
    arm.position.set(side * 0.49, 1.39, -0.01)
    group.add(arm)
    arms.push(arm)
  }
  group.userData = { legs, arms }
  group.position.set(game.player.x, game.player.y, game.player.z)
  worldRoot.add(group)
  return group
}

function makeFirstPersonArm(skin) {
  const group = new THREE.Group()
  const shirtColor = skin === 'girl' ? '#bf7186' : '#638a58'
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.43, 0.28), makePixelMaterial(shirtColor, skin === 'girl' ? '#e2a3a9' : '#a8bd77'))
  sleeve.position.y = -0.12
  group.add(sleeve)
  const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.11, 0.275), makePixelMaterial(skin === 'girl' ? '#8d5267' : '#476942', '#b5c783'))
  cuff.position.y = -0.37
  group.add(cuff)
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.2, 0.24), makePixelMaterial('#efc6a6', '#f8dfbd'))
  hand.position.set(0, -0.51, -0.01)
  group.add(hand)
  group.position.set(0.48, -0.39, -0.76)
  group.rotation.set(-0.17, 0, -0.08)
  camera.add(group)
  return group
}

function setSkin(skin) {
  game.skin = skin
  document.querySelectorAll('[data-skin]').forEach((option) => option.classList.toggle('is-selected', option.dataset.skin === skin))
  if (playerModel) {
    worldRoot.remove(playerModel)
    playerModel = makeCharacter(skin)
    playerModel.visible = !game.active
  }
  if (armModel) camera.remove(armModel)
  armModel = makeFirstPersonArm(skin)
  armModel.visible = game.active
}

function clearWorld() {
  for (const meshes of chunkMeshes.values()) for (const mesh of meshes) {
    worldRoot.remove(mesh)
    mesh.geometry.dispose()
  }
  chunkMeshes.clear()
  blockMeshes.length = 0
  for (const plant of plantMeshes) plant.geometry.dispose()
  for (const item of [...plantMeshes, ...animalModels, playerModel, rainMesh]) if (item) worldRoot.remove(item)
  if (armModel) camera.remove(armModel)
  plantMeshes = []
  animalModels = []
  playerModel = undefined
  armModel = undefined
  rainMesh = undefined
}

async function buildWorld(seed, onProgress) {
  clearWorld()
  await createGround(seed, onProgress)
  game.player.x = THREE.MathUtils.clamp(game.player.x, WORLD_MIN + 1, WORLD_MIN + WORLD_SIZE - 2)
  game.player.z = THREE.MathUtils.clamp(game.player.z, WORLD_MIN + 1, WORLD_MIN + WORLD_SIZE - 2)
  if (game.player.y <= 0) game.player.y = (topHeights.get(`${Math.round(game.player.x)},${Math.round(game.player.z)}`) ?? 3) + 1
  playerModel = makeCharacter(game.skin)
  playerModel.visible = !game.active
  armModel = makeFirstPersonArm(game.skin)
  armModel.visible = game.active
  camera.position.set(game.player.x, game.player.y + 1.62, game.player.z)
  camera.rotation.order = 'YXZ'
  createRain()
  updateHud()
}

function createRain() {
  const dropCount = 380
  rainPositions = new Float32Array(dropCount * 6)
  for (let index = 0; index < dropCount; index += 1) {
    const x = (Math.random() - 0.5) * 38
    const y = Math.random() * 17
    const z = (Math.random() - 0.5) * 38
    const offset = index * 6
    rainPositions.set([x, y, z, x - 0.08, y - 0.55, z], offset)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3).setUsage(THREE.DynamicDrawUsage))
  rainMesh = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: '#c9efff', transparent: true, opacity: 0.48 }))
  rainMesh.visible = false
  worldRoot.add(rainMesh)
}

function updateSky() {
  const night = isNight || game.dayTime > 0.72 || game.dayTime < 0.2
  const skyColor = new THREE.Color(night ? '#182a43' : game.weather === 'rain' ? '#718795' : '#9acbe1')
  const groundColor = new THREE.Color(night ? '#273547' : game.weather === 'rain' ? '#65756f' : '#5c7552')
  scene.background.copy(skyColor)
  scene.fog.color.copy(skyColor)
  ambient.color.set(night ? '#7389ae' : '#fff3d0')
  ambient.groundColor.copy(groundColor)
  ambient.intensity = night ? 0.72 : game.weather === 'rain' ? 1.45 : 2.1
  sun.intensity = night ? 0.28 : game.weather === 'rain' ? 1.3 : 3.1
  sun.color.set(night ? '#9eb9e8' : '#fff2cf')
  if (rainMesh) rainMesh.visible = game.weather === 'rain'
}

function serializeWorld() {
  return {
    version: 1, seed: game.seed, name: game.name, mode: game.mode, skin: game.skin,
    weather: game.weather, dayTime: game.dayTime, player: game.player,
    inventory: game.inventory, selected: game.selected, health: game.health,
    edits: [...game.edits.entries()], savedAt: Date.now(),
  }
}

function saveWorld(showMessage = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializeWorld()))
    game.lastSaved = Date.now()
    if (showMessage) showToast('Світ збережено')
    updateMenuSaveState()
    return true
  } catch {
    if (showMessage) showToast('Не вдалося зберегти світ')
    return false
  }
}

function readSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    return data?.version === 1 ? data : null
  } catch { return null }
}

async function applySave(data) {
  game.name = data.name || 'Тиха долина'
  game.mode = data.mode === 'creative' ? 'creative' : 'survival'
  game.skin = data.skin === 'girl' ? 'girl' : 'boy'
  game.weather = data.weather === 'rain' ? 'rain' : 'clear'
  game.dayTime = Number.isFinite(data.dayTime) ? data.dayTime : 0.23
  game.player = { ...game.player, ...(data.player || {}) }
  game.inventory = { ...game.inventory, ...(data.inventory || {}) }
  game.selected = Math.max(0, Math.min(BLOCKS.length - 1, data.selected || 0))
  game.health = data.health || 100
  game.edits = new Map(Array.isArray(data.edits) ? data.edits : [])
  isNight = game.dayTime > 0.72 || game.dayTime < 0.2
  await buildWorld(data.seed || 3721, (progress) => {
    document.querySelector('#resume-button').textContent = progress
  })
}

function updateMenuSaveState() {
  const save = readSave()
  document.querySelector('#resume-button').hidden = !save
  const note = document.querySelector('#resume-note')
  note.hidden = !save
  if (save) note.textContent = `Є збережений світ «${save.name}» · ${save.mode === 'creative' ? 'творчий режим' : 'виживання'}`
  document.querySelector('#play-label').textContent = save ? 'Грати далі' : 'Грати'
}

function updateHud() {
  document.querySelector('#hud-world-name').textContent = game.name
  document.querySelector('#pause-title').textContent = game.name
  document.querySelector('#hud-world-state').textContent = `${game.mode === 'creative' ? 'ТВОРЧИЙ' : 'ВИЖИВАННЯ'} · ДЕНЬ ${Math.floor(game.dayTime * 4) + 1}`
  document.querySelector('#weather-button').innerHTML = `<span>${game.weather === 'rain' ? '☂' : '☀'}</span><b>${game.weather === 'rain' ? 'Дощ' : 'Ясно'}</b>`
  document.querySelector('#time-button').innerHTML = `<span>${isNight ? '☀' : '☾'}</span><b>${isNight ? 'День' : 'Ніч'}</b>`
  document.querySelector('#game-vitals').hidden = game.mode === 'creative'
  document.querySelector('#health-label').textContent = String(game.health)
  hotbar.innerHTML = BLOCKS.map((type, index) => `
    <button class="hotbar-slot ${index === game.selected ? 'is-selected' : ''}" data-slot="${index}" title="${BLOCK_LABELS[type]} · ${index + 1}">
      <span class="item-cube item-${type}"><i></i></span><small>${game.mode === 'creative' ? '∞' : (game.inventory[type] || 0)}</small>
      <kbd>${index + 1}</kbd>
    </button>`).join('')
  document.querySelector('#selected-label').textContent = BLOCK_LABELS[BLOCKS[game.selected]]
  document.querySelector('#inventory-count').textContent = game.mode === 'creative' ? '∞' : String(game.inventory[BLOCKS[game.selected]] || 0)
  document.querySelector('#game-hint').innerHTML = isTouchDevice() ? 'Рухайся джойстиком · торкнись блока, щоб зламати' : 'Клацни по блоку, щоб зламати <kbd>E</kbd> крафт'
}

function isTouchDevice() { return window.matchMedia('(pointer: coarse)').matches }

function updateRecipes() {
  const recipes = [
    { id: 'planks', name: 'Дошки ×4', icon: '▤', cost: { wood: 1 }, output: { planks: 4 } },
    { id: 'sticks', name: 'Палиці ×4', icon: '╱', cost: { planks: 2 }, output: { sticks: 4 } },
    { id: 'pickaxe', name: 'Кам’яна кирка', icon: '⛏', cost: { stone: 3, sticks: 2 }, output: { pickaxe: 1 } },
    { id: 'sword', name: 'Дерев’яний меч', icon: '⚔', cost: { planks: 2, sticks: 1 }, output: { sword: 1 } },
    { id: 'helmet', name: 'Шкіряний шолом', icon: '◒', cost: { leather: 5 }, output: { helmet: 1 } },
    { id: 'chestplate', name: 'Шкіряний нагрудник', icon: '▣', cost: { leather: 8 }, output: { chestplate: 1 } },
  ]
  document.querySelector('#recipe-list').innerHTML = recipes.map((recipe) => {
    const canCraft = game.mode === 'creative' || Object.entries(recipe.cost).every(([item, count]) => (game.inventory[item] || 0) >= count)
    const costText = Object.entries(recipe.cost).map(([item, count]) => `${count} ${item === 'wood' ? 'деревини' : item === 'planks' ? 'дошки' : item === 'sticks' ? 'палиці' : item === 'stone' ? 'камінь' : 'шкіри'}`).join(' · ')
    return `<button class="recipe-row ${canCraft ? '' : 'is-unavailable'}" data-recipe="${recipe.id}" ${canCraft ? '' : 'disabled'}><span class="recipe-icon">${recipe.icon}</span><span class="recipe-copy"><b>${recipe.name}</b><small>${costText}</small></span><span class="recipe-create">Створити ↗</span></button>`
  }).join('')
}

function craftItem(id) {
  const recipes = {
    planks: { cost: { wood: 1 }, output: { planks: 4 } },
    sticks: { cost: { planks: 2 }, output: { sticks: 4 } },
    pickaxe: { cost: { stone: 3, sticks: 2 }, output: { pickaxe: 1 } },
    sword: { cost: { planks: 2, sticks: 1 }, output: { sword: 1 } },
    helmet: { cost: { leather: 5 }, output: { helmet: 1 } },
    chestplate: { cost: { leather: 8 }, output: { chestplate: 1 } },
  }
  const recipe = recipes[id]
  if (!recipe || (game.mode !== 'creative' && !Object.entries(recipe.cost).every(([item, count]) => game.inventory[item] >= count))) return
  if (game.mode !== 'creative') for (const [item, count] of Object.entries(recipe.cost)) game.inventory[item] -= count
  for (const [item, count] of Object.entries(recipe.output)) game.inventory[item] = (game.inventory[item] || 0) + count
  updateRecipes()
  updateHud()
  saveWorld()
  showToast('Предмет створено')
}

function updateMenu() {
  menuScreen.hidden = false
  gameUI.hidden = true
  app.classList.add('is-menu')
  if (playerModel) playerModel.visible = true
  if (armModel) armModel.visible = false
  createPanel.hidden = true
  skinsPanel.hidden = true
  pausePanel.hidden = true
  craftPanel.hidden = true
  game.active = false
  updateMenuSaveState()
  saveWorld()
}

function startGame() {
  menuScreen.hidden = true
  createPanel.hidden = true
  skinsPanel.hidden = true
  pausePanel.hidden = true
  gameUI.hidden = false
  app.classList.remove('is-menu')
  game.active = true
  if (playerModel) playerModel.visible = false
  if (armModel) armModel.visible = true
  game.lastSaved = Date.now()
  updateHud()
  updateMovement(0)
  canvas.focus?.()
  showToast(game.mode === 'creative' ? 'Творчий режим · усе для будівництва' : 'Знайди місце для першої домівки')
}

function createNewWorld() {
  const createButton = document.querySelector('#create-world-button')
  const errorMessage = document.querySelector('#world-create-error')
  const originalLabel = createButton.innerHTML
  errorMessage.hidden = true
  createButton.disabled = true
  createButton.textContent = 'Створюємо світ…'
  setTimeout(async () => {
    try {
      await generateWorldFromForm()
    } catch (error) {
      console.error('World creation failed:', error)
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      game.active = false
      menuScreen.hidden = false
      gameUI.hidden = true
      app.classList.add('is-menu')
      createPanel.hidden = false
      errorMessage.textContent = `Не вдалося створити світ: ${detail}`
      errorMessage.hidden = false
    } finally {
      createButton.disabled = false
      createButton.innerHTML = originalLabel
    }
  }, 80)
}

async function generateWorldFromForm() {
  game.name = document.querySelector('#world-name').value.trim() || 'Тиха долина'
  game.seed = Math.floor(Math.random() * 900000) + 100000
  game.mode = document.querySelector('.mode-option.is-selected')?.dataset.mode || 'survival'
  game.weather = 'clear'
  game.dayTime = 0.23
  game.player = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0.22, verticalSpeed: 0 }
  game.inventory = { grass: 32, dirt: 12, stone: 10, wood: 8, leaves: 5, sand: 0, brick: 0, flower: 0, sticks: 2, planks: 0, leather: 8, pickaxe: 0, sword: 0, helmet: 0, chestplate: 0 }
  game.edits = new Map()
  game.selected = 0
  game.health = 100
  isNight = false
  await buildWorld(game.seed, (progress) => { createButton.textContent = progress })
  saveWorld()
  startGame()
}

function showToast(text) {
  const toast = document.querySelector('#toast')
  toast.textContent = text
  toast.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2100)
}

function getTarget() {
  raycaster.setFromCamera(center, camera)
  const hit = raycaster.intersectObjects(blockMeshes, false)[0]
  if (!hit || hit.distance > 8) return null
  const key = hit.object.userData.faceMap[hit.faceIndex]
  if (!key) return null
  const coords = unpackKey(key)
  return { key, coords, normal: hit.face.normal.clone(), type: blockMap.get(key)?.type, distance: hit.distance }
}

function mineBlock() {
  if (!game.active) return
  const target = getTarget()
  if (!target) return
  const block = blockMap.get(target.key)
  if (!block) return
  blockMap.delete(target.key)
  game.edits.set(target.key, null)
  if (game.mode === 'survival') game.inventory[block.type] = (game.inventory[block.type] || 0) + 1
  rebuildNear(target.coords[0], target.coords[2])
  if (target.coords[0] === 0 && target.coords[2] === 0 && target.coords[1] >= topHeights.get('0,0')) {
    game.health = Math.max(20, game.health - 4)
    playerModel.position.y = Math.max(0, playerModel.position.y - 1)
  }
  updateHud()
  saveWorld()
  if (armModel) armModel.rotation.x = -1.2
}

function placeBlock() {
  if (!game.active) return
  const target = getTarget()
  if (!target) return
  const [x, y, z] = target.coords
  const nx = Math.round(target.normal.x)
  const ny = Math.round(target.normal.y)
  const nz = Math.round(target.normal.z)
  const position = [x + nx, y + ny, z + nz]
  const key = keyOf(...position)
  if (blockMap.has(key) || position[0] < WORLD_MIN || position[0] >= WORLD_MIN + WORLD_SIZE || position[2] < WORLD_MIN || position[2] >= WORLD_MIN + WORLD_SIZE) return
  if (Math.abs(position[0] - game.player.x) < 0.75 && Math.abs(position[2] - game.player.z) < 0.75 && position[1] >= game.player.y - 1 && position[1] <= game.player.y + 1.5) {
    showToast('Тут замало місця')
    return
  }
  const type = BLOCKS[game.selected]
  if (game.mode === 'survival' && (game.inventory[type] || 0) <= 0) return showToast('У тебе закінчилися блоки')
  blockMap.set(key, { type })
  game.edits.set(key, type)
  if (game.mode === 'survival') game.inventory[type] -= 1
  rebuildNear(position[0], position[2])
  updateHud()
  saveWorld()
  if (armModel) armModel.rotation.x = -0.7
}

function selectSlot(index) {
  game.selected = Math.max(0, Math.min(BLOCKS.length - 1, index))
  updateHud()
}

function updateMovement(delta) {
  if (!game.active || pausePanel.hidden === false || craftPanel.hidden === false) return
  const forward = Number(moveKeys.forward) - Number(moveKeys.back) - touchVector.y
  const strafe = Number(moveKeys.right) - Number(moveKeys.left) + touchVector.x
  const length = Math.hypot(forward, strafe)
  const moving = length > 0.05
  const speed = 5.4
  if (moving) {
    const f = forward / Math.max(1, length)
    const s = strafe / Math.max(1, length)
    const sin = Math.sin(game.player.yaw)
    const cos = Math.cos(game.player.yaw)
    game.player.x += (-sin * f + cos * s) * speed * delta
    game.player.z += (-cos * f - sin * s) * speed * delta
    game.player.x = THREE.MathUtils.clamp(game.player.x, WORLD_MIN + 1, WORLD_MIN + WORLD_SIZE - 2)
    game.player.z = THREE.MathUtils.clamp(game.player.z, WORLD_MIN + 1, WORLD_MIN + WORLD_SIZE - 2)
  }
  const groundY = (topHeights.get(`${Math.round(game.player.x)},${Math.round(game.player.z)}`) ?? 3) + 1
  if (jumpRequested && Math.abs(game.player.y - groundY) < 0.18) game.player.verticalSpeed = 6.3
  jumpRequested = false
  game.player.verticalSpeed -= 17 * delta
  game.player.y += game.player.verticalSpeed * delta
  if (game.player.y < groundY) {
    game.player.y = groundY
    game.player.verticalSpeed = 0
  }
  playerModel.position.set(game.player.x, game.player.y, game.player.z)
  playerModel.rotation.y = game.player.yaw
  const stride = moving && game.player.y <= groundY + 0.03 ? Math.sin(elapsed * 11) * 0.58 : 0
  playerModel.userData.legs[0].rotation.x = stride
  playerModel.userData.legs[1].rotation.x = -stride
  playerModel.userData.arms[0].rotation.x = THREE.MathUtils.damp(playerModel.userData.arms[0].rotation.x, moving ? -stride * 0.7 : 0, 9, delta)
  playerModel.userData.arms[1].rotation.x = THREE.MathUtils.damp(playerModel.userData.arms[1].rotation.x, moving ? stride * 0.7 : 0, 9, delta)
  game.player.pitch = THREE.MathUtils.clamp(game.player.pitch, -0.76, 0.76)
  camera.position.set(game.player.x, game.player.y + 1.62, game.player.z)
  camera.rotation.set(-game.player.pitch, game.player.yaw, 0, 'YXZ')
  camera.updateMatrixWorld()
  if (armModel) armModel.rotation.x = THREE.MathUtils.damp(armModel.rotation.x, moving ? -0.24 - Math.sin(elapsed * 11) * 0.08 : 0, 8, delta)
}

function updateAnimals(delta) {
  for (const animal of animalModels) {
    const data = animal.userData
    data.step += delta * data.pace * 3
    if (randomAt(Math.floor(elapsed), animal.position.x + 33) > 0.997) data.direction += (Math.random() - 0.5) * 2
    animal.position.x += Math.sin(data.direction) * data.pace * delta
    animal.position.z += Math.cos(data.direction) * data.pace * delta
    const bound = 35
    if (Math.abs(animal.position.x) > bound || Math.abs(animal.position.z) > bound) data.direction += Math.PI
    animal.position.y = (topHeights.get(`${Math.round(animal.position.x)},${Math.round(animal.position.z)}`) ?? 3) + 1
    animal.rotation.y = data.direction
    data.legs.forEach((leg, index) => { leg.rotation.x = Math.sin(data.step + index * Math.PI) * 0.45 })
  }
}

function updateRain(delta) {
  if (!rainMesh?.visible) return
  const positions = rainMesh.geometry.attributes.position
  for (let index = 0; index < positions.count; index += 2) {
    let y = positions.getY(index) - 19 * delta
    let x = positions.getX(index)
    let z = positions.getZ(index)
    if (y < -1) {
      x = (Math.random() - 0.5) * 38
      y = 15 + Math.random() * 7
      z = (Math.random() - 0.5) * 38
    }
    const offset = index * 3
    positions.array[offset] = x + game.player.x
    positions.array[offset + 1] = y
    positions.array[offset + 2] = z + game.player.z
    positions.array[offset + 3] = x - 0.08 + game.player.x
    positions.array[offset + 4] = y - 0.55
    positions.array[offset + 5] = z + game.player.z
  }
  positions.needsUpdate = true
}

function frame(now) {
  requestAnimationFrame(frame)
  const delta = Math.min(0.04, (now - lastFrame) / 1000)
  lastFrame = now
  elapsed += delta
  if (game.active) {
    updateMovement(delta)
    updateAnimals(delta)
    updateRain(delta)
    if (game.mode === 'survival' && pausePanel.hidden && craftPanel.hidden) game.dayTime = (game.dayTime + delta / 230) % 1
    updateSky()
    if (game.lastSaved && Date.now() - game.lastSaved > 9000) saveWorld()
    const target = getTarget()
    const label = document.querySelector('#target-label')
    label.textContent = target ? BLOCK_LABELS[target.type] || target.type : ''
    label.classList.toggle('is-visible', Boolean(target))
  } else {
    camera.position.x = Math.sin(elapsed * 0.045) * 3.5
    camera.position.y = 12 + Math.sin(elapsed * 0.1) * 0.35
    camera.position.z = 19 + Math.cos(elapsed * 0.045) * 3.5
    camera.lookAt(0, 3, 0)
    updateAnimals(delta)
  }
  renderer.render(scene, camera)
}

document.querySelector('#play-button').addEventListener('click', () => {
  createPanel.hidden = false
  skinsPanel.hidden = true
})
document.querySelector('#skins-button').addEventListener('click', () => {
  skinsPanel.hidden = false
  createPanel.hidden = true
})
document.querySelector('#create-world-button').addEventListener('click', createNewWorld)
document.querySelector('#resume-button').addEventListener('click', async () => {
  const save = readSave()
  if (save) {
    const button = document.querySelector('#resume-button')
    button.disabled = true
    try {
      await applySave(save)
      startGame()
    } catch (error) {
      console.error('World loading failed:', error)
      showToast('Не вдалося завантажити збережений світ')
    } finally {
      button.disabled = false
      button.textContent = 'Продовжити збережений світ'
      updateMenuSaveState()
    }
  }
})
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach((option) => option.classList.toggle('is-selected', option === button))
}))
document.querySelectorAll('[data-skin]').forEach((button) => button.addEventListener('click', () => setSkin(button.dataset.skin)))
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => { document.getElementById(button.dataset.close).hidden = true }))
document.querySelector('#pause-button').addEventListener('click', () => { pausePanel.hidden = false; saveWorld() })
document.querySelector('#continue-button').addEventListener('click', () => { pausePanel.hidden = true })
document.querySelector('#save-exit-button').addEventListener('click', () => { saveWorld(true); updateMenu() })
document.querySelector('#craft-button').addEventListener('click', () => { updateRecipes(); craftPanel.hidden = false })
document.querySelector('#recipe-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-recipe]')
  if (button && !button.disabled) craftItem(button.dataset.recipe)
})
document.querySelector('#weather-button').addEventListener('click', () => {
  game.weather = game.weather === 'clear' ? 'rain' : 'clear'
  updateSky(); updateHud(); saveWorld()
})
document.querySelector('#time-button').addEventListener('click', () => {
  isNight = !isNight
  game.dayTime = isNight ? 0.78 : 0.28
  updateSky(); updateHud(); saveWorld()
})
hotbar.addEventListener('click', (event) => {
  const slot = event.target.closest('[data-slot]')
  if (slot) selectSlot(Number(slot.dataset.slot))
})
document.querySelector('#pause-button').addEventListener('dblclick', () => { pausePanel.hidden = false })
document.querySelector('#hotbar').addEventListener('wheel', (event) => {
  event.preventDefault()
  selectSlot((game.selected + (event.deltaY > 0 ? 1 : BLOCKS.length - 1)) % BLOCKS.length)
}, { passive: false })
document.querySelector('#world-name').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') createNewWorld()
})

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
  if (event.key === 'Escape' && game.active) {
    if (!craftPanel.hidden) craftPanel.hidden = true
    else pausePanel.hidden = !pausePanel.hidden
    saveWorld()
    return
  }
  if (!game.active) return
  if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') moveKeys.forward = true
  if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') moveKeys.back = true
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') moveKeys.left = true
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') moveKeys.right = true
  if (event.key === ' ') jumpRequested = true
  if (event.key.toLowerCase() === 'e') { updateRecipes(); craftPanel.hidden = !craftPanel.hidden }
  if (/^[1-8]$/.test(event.key)) selectSlot(Number(event.key) - 1)
})
document.addEventListener('keyup', (event) => {
  if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') moveKeys.forward = false
  if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') moveKeys.back = false
  if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') moveKeys.left = false
  if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') moveKeys.right = false
})

canvas.addEventListener('contextmenu', (event) => { event.preventDefault(); if (game.active) placeBlock() })
canvas.addEventListener('pointerdown', (event) => {
  if (!game.active || event.button === 2) return
  dragState = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, pointerId: event.pointerId }
  canvas.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return
  const dx = event.clientX - dragState.lastX
  const dy = event.clientY - dragState.lastY
  dragState.lastX = event.clientX
  dragState.lastY = event.clientY
  if (Math.hypot(event.clientX - dragState.x, event.clientY - dragState.y) > 4) dragState.moved = true
  game.player.yaw -= dx * (event.pointerType === 'touch' ? 0.008 : 0.006)
  game.player.pitch = THREE.MathUtils.clamp(game.player.pitch + dy * 0.006, -0.12, 0.76)
})
canvas.addEventListener('pointerup', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return
  if (!dragState.moved) mineBlock()
  dragState = null
})
canvas.addEventListener('pointercancel', () => { dragState = null })

const joystick = document.querySelector('#joystick')
const joystickKnob = document.querySelector('#joystick-knob')
let joystickPointer = null
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  joystickPointer = event.pointerId
  joystick.setPointerCapture(event.pointerId)
  moveJoystick(event)
})
joystick.addEventListener('pointermove', (event) => { if (joystickPointer === event.pointerId) moveJoystick(event) })
const resetJoystick = () => { joystickPointer = null; touchVector = { x: 0, y: 0 }; joystickKnob.style.transform = 'translate(0, 0)' }
joystick.addEventListener('pointerup', resetJoystick)
joystick.addEventListener('pointercancel', resetJoystick)
function moveJoystick(event) {
  const rect = joystick.getBoundingClientRect()
  const max = rect.width * 0.31
  let dx = event.clientX - (rect.left + rect.width / 2)
  let dy = event.clientY - (rect.top + rect.height / 2)
  const distance = Math.hypot(dx, dy)
  if (distance > max) { dx *= max / distance; dy *= max / distance }
  touchVector = { x: dx / max, y: dy / max }
  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`
}
document.querySelector('#mine-button').addEventListener('pointerdown', (event) => { event.preventDefault(); mineBlock() })
document.querySelector('#place-button').addEventListener('pointerdown', (event) => { event.preventDefault(); placeBlock() })
document.querySelector('#jump-button').addEventListener('pointerdown', (event) => { event.preventDefault(); jumpRequested = true })

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
})
window.addEventListener('beforeunload', () => { if (game.active) saveWorld() })
document.addEventListener('visibilitychange', () => { if (document.hidden && game.active) saveWorld() })

updateMenuSaveState()
requestAnimationFrame(frame)