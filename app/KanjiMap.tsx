'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './kanji-map.module.css'

type Mastery = 'known' | 'learning' | 'unknown'

type Radical = {
  glyph: string
  label: string
  meaning: string
  position: [number, number]
  items: string
}

type Kanji = {
  glyph: string
  meaning: string
  on: string
  kun: string
  strokes: number
  radical: Radical
  mastery: Mastery
}

const RADICALS: Radical[] = [
  {
    glyph: '木',
    label: 'き',
    meaning: 'tree',
    position: [7, 5],
    items:
      '木|tree|モク|き|4,林|woods|リン|はやし|8,森|forest|シン|もり|12,枝|branch|シ|えだ|8,校|school|コウ|—|10,村|village|ソン|むら|7,材|timber|ザイ|—|7,桜|cherry blossom|オウ|さくら|10,植|plant|ショク|うえる|12,根|root|コン|ね|10,机|desk|キ|つくえ|6,板|board|ハン|いた|8',
  },
  {
    glyph: '氵',
    label: 'さんずい',
    meaning: 'water',
    position: [18, 5],
    items:
      '水|water|スイ|みず|4,海|sea|カイ|うみ|9,河|river|カ|かわ|8,湖|lake|コ|みずうみ|12,泳|swim|エイ|およぐ|8,洗|wash|セン|あらう|9,酒|alcohol|シュ|さけ|10,池|pond|チ|いけ|6,波|wave|ハ|なみ|8,洋|ocean / western|ヨウ|—|9,港|harbor|コウ|みなと|12,涙|tears|ルイ|なみだ|10',
  },
  {
    glyph: '亻',
    label: 'にんべん',
    meaning: 'person',
    position: [29, 5],
    items:
      '人|person|ジン|ひと|2,休|rest|キュウ|やすむ|6,体|body|タイ|からだ|7,住|reside|ジュウ|すむ|7,何|what|カ|なに|7,作|make|サク|つくる|7,使|use|シ|つかう|8,代|substitute|ダイ|かわる|5,位|rank|イ|くらい|7,他|other|タ|ほか|5,係|relation|ケイ|かかり|9,優|gentle / excellent|ユウ|やさしい|17',
  },
  {
    glyph: '日',
    label: 'ひ',
    meaning: 'sun / day',
    position: [40, 5],
    items:
      '日|sun / day|ニチ|ひ|4,明|bright|メイ|あかるい|8,時|time|ジ|とき|10,晴|clear weather|セイ|はれる|12,星|star|セイ|ほし|9,映|reflect|エイ|うつる|9,昨|yesterday|サク|—|9,春|spring|シュン|はる|9,晩|evening|バン|—|12,朝|morning|チョウ|あさ|12,曜|weekday|ヨウ|—|18,暗|dark|アン|くらい|13',
  },
  {
    glyph: '火',
    label: 'ひ',
    meaning: 'fire',
    position: [50, 5],
    items:
      '火|fire|カ|ひ|4,灰|ash|カイ|はい|6,灯|lamp|トウ|ひ|6,炎|flame|エン|ほのお|8,焼|bake / burn|ショウ|やく|12,煙|smoke|エン|けむり|13,照|illuminate|ショウ|てる|13,熱|heat|ネツ|あつい|15,然|so / natural|ゼン|—|12,無|nothing|ム|ない|12,災|disaster|サイ|わざわい|7,煮|boil|シャ|にる|12',
  },
  {
    glyph: '言',
    label: 'ごんべん',
    meaning: 'speech',
    position: [7, 15],
    items:
      '言|say|ゲン|いう|7,話|speak / story|ワ|はなす|13,語|language|ゴ|かたる|14,読|read|ドク|よむ|14,記|record|キ|しるす|10,説|explain|セツ|とく|14,計|measure|ケイ|はかる|9,訳|translate / reason|ヤク|わけ|11,試|test|シ|ためす|13,課|section / lesson|カ|—|15,認|recognize|ニン|みとめる|14,論|theory|ロン|—|15',
  },
  {
    glyph: '忄',
    label: 'りっしんべん',
    meaning: 'heart',
    position: [18, 15],
    items:
      '心|heart|シン|こころ|4,思|think|シ|おもう|9,忘|forget|ボウ|わすれる|7,忙|busy|ボウ|いそがしい|6,情|feeling|ジョウ|なさけ|11,悪|bad|アク|わるい|11,愛|love|アイ|—|13,意|intention|イ|—|13,感|feeling|カン|—|13,想|concept|ソウ|—|13,怒|anger|ド|おこる|9,怖|fearful|フ|こわい|8',
  },
  {
    glyph: '扌',
    label: 'てへん',
    meaning: 'hand',
    position: [29, 15],
    items:
      '手|hand|シュ|て|4,打|strike|ダ|うつ|5,持|hold|ジ|もつ|9,押|push|オウ|おす|8,投|throw|トウ|なげる|7,拾|pick up|シュウ|ひろう|9,指|finger / point|シ|ゆび|9,探|search|タン|さがす|11,接|touch / join|セツ|つぐ|11,提|present|テイ|さげる|12,換|exchange|カン|かえる|12,操|operate|ソウ|あやつる|16',
  },
  {
    glyph: '糸',
    label: 'いとへん',
    meaning: 'thread',
    position: [40, 15],
    items:
      '糸|thread|シ|いと|6,紙|paper|シ|かみ|10,絵|picture|カイ|え|12,終|end|シュウ|おわる|11,細|thin / detailed|サイ|ほそい|11,線|line|セン|—|15,組|group|ソ|くむ|11,結|tie / connect|ケツ|むすぶ|12,緑|green|リョク|みどり|14,級|grade|キュウ|—|9,続|continue|ゾク|つづく|13,絹|silk|ケン|きぬ|13',
  },
  {
    glyph: '口',
    label: 'くち',
    meaning: 'mouth',
    position: [50, 15],
    items:
      '口|mouth|コウ|くち|3,名|name|メイ|な|6,味|taste|ミ|あじ|8,唱|chant|ショウ|となえる|11,呼|call|コ|よぶ|8,員|member|イン|—|10,問|question|モン|とう|11,聞|hear|ブン|きく|14,吸|inhale|キュウ|すう|6,告|tell|コク|つげる|7,和|harmony|ワ|やわらぐ|8,品|goods|ヒン|しな|9',
  },
  {
    glyph: '艹',
    label: 'くさかんむり',
    meaning: 'grass',
    position: [7, 25],
    items:
      '花|flower|カ|はな|7,草|grass|ソウ|くさ|9,茶|tea|チャ|—|9,英|excellent / English|エイ|—|8,菜|vegetable|サイ|な|11,薬|medicine|ヤク|くすり|16,若|young|ジャク|わかい|8,苦|suffering|ク|くるしい|8,荷|baggage|カ|に|10,葉|leaf|ヨウ|は|12,落|fall|ラク|おちる|12,著|author / notable|チョ|あらわす|11',
  },
  {
    glyph: '土',
    label: 'つちへん',
    meaning: 'earth',
    position: [18, 25],
    items:
      '土|earth|ド|つち|3,地|ground|チ|—|6,場|place|ジョウ|ば|12,城|castle|ジョウ|しろ|9,坂|slope|ハン|さか|7,堂|hall|ドウ|—|11,塔|tower|トウ|—|12,塩|salt|エン|しお|13,境|boundary|キョウ|さかい|14,型|model / type|ケイ|かた|9,域|region|イキ|—|11,増|increase|ゾウ|ます|14',
  },
  {
    glyph: '金',
    label: 'かねへん',
    meaning: 'metal',
    position: [29, 25],
    items:
      '金|gold / money|キン|かね|8,銀|silver|ギン|—|14,鉄|iron|テツ|—|13,鉱|mineral|コウ|—|13,銅|copper|ドウ|—|14,針|needle|シン|はり|10,鋼|steel|コウ|はがね|16,録|record|ロク|—|16,鏡|mirror|キョウ|かがみ|19,鈴|bell|レイ|すず|13,鍵|key|ケン|かぎ|17,錦|brocade|キン|にしき|16',
  },
  {
    glyph: '雨',
    label: 'あめかんむり',
    meaning: 'rain',
    position: [40, 25],
    items:
      '雨|rain|ウ|あめ|8,雪|snow|セツ|ゆき|11,雲|cloud|ウン|くも|12,電|electricity|デン|—|13,雷|thunder|ライ|かみなり|13,霜|frost|ソウ|しも|17,零|zero|レイ|—|13,需|demand|ジュ|—|14,震|quake|シン|ふるう|15,露|dew|ロ|つゆ|21,雰|atmosphere|フン|—|12,霞|haze|カ|かすみ|17',
  },
  {
    glyph: '山',
    label: 'やま',
    meaning: 'mountain',
    position: [50, 25],
    items:
      '山|mountain|サン|やま|3,岩|boulder|ガン|いわ|8,岸|shore|ガン|きし|8,島|island|トウ|しま|10,崎|cape|キ|さき|11,峠|mountain pass|—|とうげ|9,岳|peak|ガク|たけ|8,峰|summit|ホウ|みね|10,炭|charcoal|タン|すみ|9,崇|revere|スウ|あがめる|11,崩|crumble|ホウ|くずれる|11,嵐|storm|ラン|あらし|12',
  },
]

const masteryLabels: Record<Mastery, string> = {
  known: 'Known',
  learning: 'Learning',
  unknown: 'New',
}

const hashGlyph = (glyph: string) => glyph.codePointAt(0) ?? 0

const allKanji: Kanji[] = RADICALS.flatMap((radical) =>
  radical.items.split(',').map((entry) => {
    const [glyph, meaning, on, kun, strokes] = entry.split('|')
    const bucket = hashGlyph(glyph) % 10
    return {
      glyph,
      meaning,
      on,
      kun,
      strokes: Number(strokes),
      radical,
      mastery: bucket < 3 ? 'known' : bucket < 7 ? 'learning' : 'unknown',
    }
  }),
)

const COLS = 58
const ROWS = 34
const CELL = 64
const MAP_WIDTH = COLS * CELL
const MAP_HEIGHT = ROWS * CELL

type Cell =
  { kind: 'radical'; radical: Radical; key: string } | { kind: 'kanji'; kanji: Kanji; key: string }

function nearestRadical(x: number, y: number) {
  let nearest = RADICALS[0]
  let distance = Number.POSITIVE_INFINITY
  for (const radical of RADICALS) {
    const dx = x - radical.position[0]
    const dy = y - radical.position[1]
    const score = dx * dx + dy * dy
    if (score < distance) {
      distance = score
      nearest = radical
    }
  }
  return nearest
}

function buildCells(): Cell[] {
  const radicalCells = new Map(RADICALS.map((radical) => [radical.position.join(':'), radical]))
  const cells: Array<Cell | undefined> = new Array(COLS * ROWS)
  const regions = new Map<Radical, number[]>(RADICALS.map((radical) => [radical, []]))

  for (let index = 0; index < COLS * ROWS; index += 1) {
    const x = index % COLS
    const y = Math.floor(index / COLS)
    const marker = radicalCells.get(`${x}:${y}`)
    if (marker) {
      cells[index] = { kind: 'radical', radical: marker, key: `r-${x}-${y}` }
    } else {
      regions.get(nearestRadical(x, y))?.push(index)
    }
  }

  for (const [region, indexes] of regions) {
    const [centerX, centerY] = region.position
    indexes.sort((left, right) => {
      const leftX = left % COLS
      const leftY = Math.floor(left / COLS)
      const rightX = right % COLS
      const rightY = Math.floor(right / COLS)
      const leftDistance = (leftX - centerX) ** 2 + (leftY - centerY) ** 2
      const rightDistance = (rightX - centerX) ** 2 + (rightY - centerY) ** 2
      return leftDistance - rightDistance || left - right
    })

    const neighboringRadicals = [...RADICALS].sort((left, right) => {
      if (left === region) return -1
      if (right === region) return 1
      const leftDistance = (left.position[0] - centerX) ** 2 + (left.position[1] - centerY) ** 2
      const rightDistance = (right.position[0] - centerX) ** 2 + (right.position[1] - centerY) ** 2
      return leftDistance - rightDistance
    })

    const uniqueCandidates = new Map<string, Kanji>()
    for (const radical of neighboringRadicals) {
      for (const kanji of allKanji) {
        if (kanji.radical === radical) uniqueCandidates.set(kanji.glyph, kanji)
      }
    }
    const candidates = [...uniqueCandidates.values()]

    if (indexes.length > candidates.length) {
      throw new Error(`Not enough unique kanji to fill the ${region.meaning} region`)
    }

    indexes.forEach((index, candidateIndex) => {
      const x = index % COLS
      const y = Math.floor(index / COLS)
      cells[index] = {
        kind: 'kanji',
        kanji: candidates[candidateIndex],
        key: `k-${x}-${y}`,
      }
    })
  }

  return cells as Cell[]
}

const CELLS = buildCells()

type DrawPoint = {
  x: number
  y: number
  pressure: number
}

const DRAW_SIDE = 256
const SAMPLE_SIDE = 48

function paintDrawStroke(context: CanvasRenderingContext2D, stroke: DrawPoint[], scale = 1) {
  if (!stroke.length) return
  context.strokeStyle = '#0b0b0a'
  context.fillStyle = '#0b0b0a'
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (stroke.length === 1) {
    context.beginPath()
    context.arc(stroke[0].x * scale, stroke[0].y * scale, 2.5 * scale, 0, Math.PI * 2)
    context.fill()
    return
  }

  for (let index = 1; index < stroke.length; index += 1) {
    const previous = stroke[index - 1]
    const current = stroke[index]
    const next = stroke[index + 1] ?? current
    const progress = (index - 0.5) / (stroke.length - 1)
    const taper = 0.28 + Math.sin(Math.PI * progress) ** 0.45 * 0.72
    const pressure = Math.max(0.42, (previous.pressure + current.pressure) / 2)
    context.lineWidth = (3.2 + 6.8 * pressure) * taper * scale
    context.beginPath()
    context.moveTo(previous.x * scale, previous.y * scale)
    context.quadraticCurveTo(
      current.x * scale,
      current.y * scale,
      ((current.x + next.x) / 2) * scale,
      ((current.y + next.y) / 2) * scale,
    )
    context.stroke()
  }
}

function maskFrom(context: CanvasRenderingContext2D) {
  const pixels = context.getImageData(0, 0, SAMPLE_SIDE, SAMPLE_SIDE).data
  const mask = new Uint8Array(SAMPLE_SIDE * SAMPLE_SIDE)
  for (let index = 0; index < mask.length; index += 1) {
    if (pixels[index * 4 + 3] > 32) mask[index] = 1
  }
  return mask
}

function maskDistanceField(mask: Uint8Array) {
  const field = new Float32Array(mask.length)
  field.fill(SAMPLE_SIDE * 2)
  for (let y = 0; y < SAMPLE_SIDE; y += 1) {
    for (let x = 0; x < SAMPLE_SIDE; x += 1) {
      const index = y * SAMPLE_SIDE + x
      if (mask[index]) {
        field[index] = 0
        continue
      }
      if (x > 0) field[index] = Math.min(field[index], field[index - 1] + 1)
      if (y > 0) field[index] = Math.min(field[index], field[index - SAMPLE_SIDE] + 1)
      if (x > 0 && y > 0)
        field[index] = Math.min(field[index], field[index - SAMPLE_SIDE - 1] + 1.4)
      if (x < SAMPLE_SIDE - 1 && y > 0)
        field[index] = Math.min(field[index], field[index - SAMPLE_SIDE + 1] + 1.4)
    }
  }
  for (let y = SAMPLE_SIDE - 1; y >= 0; y -= 1) {
    for (let x = SAMPLE_SIDE - 1; x >= 0; x -= 1) {
      const index = y * SAMPLE_SIDE + x
      if (x < SAMPLE_SIDE - 1) field[index] = Math.min(field[index], field[index + 1] + 1)
      if (y < SAMPLE_SIDE - 1) field[index] = Math.min(field[index], field[index + SAMPLE_SIDE] + 1)
      if (x < SAMPLE_SIDE - 1 && y < SAMPLE_SIDE - 1)
        field[index] = Math.min(field[index], field[index + SAMPLE_SIDE + 1] + 1.4)
      if (x > 0 && y < SAMPLE_SIDE - 1)
        field[index] = Math.min(field[index], field[index + SAMPLE_SIDE - 1] + 1.4)
    }
  }
  return field
}

function directedMaskDistance(mask: Uint8Array, field: Float32Array) {
  let distance = 0
  let count = 0
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue
    distance += Math.min(field[index], 10)
    count += 1
  }
  return count ? distance / count : 10
}

function normalizeDrawing(strokes: DrawPoint[][]) {
  const points = strokes.flat()
  if (points.length < 4) return null
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const width = maxX - minX
  const height = maxY - minY
  if (Math.max(width, height) < 18) return null
  const fit = (SAMPLE_SIDE - 12) / Math.max(width, height)
  const offsetX = (SAMPLE_SIDE - width * fit) / 2
  const offsetY = (SAMPLE_SIDE - height * fit) / 2
  return strokes.map((stroke) =>
    stroke.map((point) => ({
      x: offsetX + (point.x - minX) * fit,
      y: offsetY + (point.y - minY) * fit,
      pressure: point.pressure,
    })),
  )
}

function rankDrawing(strokes: DrawPoint[][]) {
  const normalized = normalizeDrawing(strokes)
  if (!normalized) return []
  const writtenCanvas = document.createElement('canvas')
  writtenCanvas.width = SAMPLE_SIDE
  writtenCanvas.height = SAMPLE_SIDE
  const writtenContext = writtenCanvas.getContext('2d')
  if (!writtenContext) return []
  normalized.forEach((stroke) => paintDrawStroke(writtenContext, stroke))
  const written = maskFrom(writtenContext)
  const writtenField = maskDistanceField(written)

  return allKanji
    .map((kanji) => {
      const modelCanvas = document.createElement('canvas')
      modelCanvas.width = SAMPLE_SIDE
      modelCanvas.height = SAMPLE_SIDE
      const modelContext = modelCanvas.getContext('2d')
      if (!modelContext) return { kanji, score: 0 }
      modelContext.fillStyle = '#0b0b0a'
      modelContext.font =
        '40px "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", "Noto Sans JP", sans-serif'
      modelContext.textAlign = 'center'
      modelContext.textBaseline = 'middle'
      modelContext.fillText(kanji.glyph, SAMPLE_SIDE / 2, SAMPLE_SIDE / 2 + 1)
      const model = maskFrom(modelContext)
      const score =
        directedMaskDistance(written, maskDistanceField(model)) * 0.58 +
        directedMaskDistance(model, writtenField) * 0.42
      return { kanji, score }
    })
    .sort((left, right) => left.score - right.score)
    .slice(0, 6)
    .map(({ kanji }) => kanji)
}

function DrawingSearch({
  onSelect,
  onClose,
}: {
  onSelect: (kanji: Kanji) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [strokes, setStrokes] = useState<DrawPoint[][]>([])
  const [live, setLive] = useState<DrawPoint[] | null>(null)
  const [results, setResults] = useState<Kanji[]>([])
  const [reading, setReading] = useState(false)
  const statusId = useId()

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * DRAW_SIDE,
      y: ((event.clientY - rect.top) / rect.height) * DRAW_SIDE,
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, DRAW_SIDE, DRAW_SIDE)
    context.strokeStyle = 'rgba(109, 105, 96, 0.28)'
    context.setLineDash([4, 7])
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(DRAW_SIDE / 2, 0)
    context.lineTo(DRAW_SIDE / 2, DRAW_SIDE)
    context.moveTo(0, DRAW_SIDE / 2)
    context.lineTo(DRAW_SIDE, DRAW_SIDE / 2)
    context.stroke()
    context.setLineDash([])
    for (const stroke of live ? [...strokes, live] : strokes) paintDrawStroke(context, stroke)
  }, [live, strokes])

  const recognize = (next: DrawPoint[][]) => {
    if (!next.length) {
      setResults([])
      setReading(false)
      return
    }
    setReading(true)
    window.setTimeout(() => {
      setResults(rankDrawing(next))
      setReading(false)
    }, 120)
  }

  const commit = (next: DrawPoint[][]) => {
    setStrokes(next)
    recognize(next)
  }

  return (
    <section className={styles.drawPanel} aria-label="Search by drawing">
      <div className={styles.drawHead}>
        <div>
          <span className={styles.eyebrow}>Handwriting search</span>
          <h2>Draw a kanji</h2>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Close drawing search">
          <CloseIcon />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={DRAW_SIDE}
        height={DRAW_SIDE}
        className={styles.drawCanvas}
        aria-describedby={statusId}
        aria-label="Draw a kanji to search the map"
        onPointerDown={(event) => {
          event.stopPropagation()
          event.currentTarget.setPointerCapture(event.pointerId)
          setLive([pointFrom(event)])
        }}
        onPointerMove={(event) => {
          if (!live) return
          const point = pointFrom(event)
          setLive((stroke) => {
            if (!stroke) return stroke
            const previous = stroke[stroke.length - 1]
            if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.5) return stroke
            return [...stroke, point]
          })
        }}
        onPointerUp={(event) => {
          event.stopPropagation()
          if (live?.length && live.length > 1) commit([...strokes, live])
          setLive(null)
        }}
        onPointerCancel={() => setLive(null)}
      />
      <div className={styles.drawActions}>
        <button
          type="button"
          disabled={!strokes.length}
          onClick={() => commit(strokes.slice(0, -1))}
        >
          Undo stroke
        </button>
        <button type="button" disabled={!strokes.length} onClick={() => commit([])}>
          Clear
        </button>
      </div>
      <p id={statusId} className={styles.drawStatus} aria-live="polite">
        {reading
          ? 'Reading form…'
          : results.length
            ? 'Closest matches'
            : 'Draw one stroke at a time'}
      </p>
      <div className={styles.drawResults}>
        {results.map((kanji) => (
          <button
            key={kanji.glyph}
            onClick={() => {
              onSelect(kanji)
              onClose()
            }}
          >
            <span lang="ja">{kanji.glyph}</span>
            <small>{kanji.meaning}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function AnimatedStrokeOrder({ kanji }: { kanji: Kanji }) {
  const [paths, setPaths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const code = (kanji.glyph.codePointAt(0) ?? 0).toString(16).padStart(5, '0')
    setLoading(true)
    setPaths([])
    fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${code}.svg`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Stroke data unavailable')
        return response.text()
      })
      .then((source) => {
        const document = new DOMParser().parseFromString(source, 'image/svg+xml')
        const strokePaths = [
          ...document.querySelectorAll<SVGPathElement>('g[id*="StrokePaths"] path'),
        ]
          .map((path) => path.getAttribute('d'))
          .filter((path): path is string => Boolean(path))
        setPaths(strokePaths)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') setLoading(false)
      })
    return () => controller.abort()
  }, [kanji.glyph])

  return (
    <div className={styles.strokeAnimation}>
      <svg
        key={`${kanji.glyph}-${replay}`}
        viewBox="0 0 109 109"
        role="img"
        aria-label={`Animated stroke order for ${kanji.glyph}`}
      >
        <path className={styles.strokeGuide} d="M54.5 5V104M5 54.5H104" />
        {paths.map((path, index) => (
          <path
            key={`${replay}-${index}`}
            className={styles.animatedStroke}
            d={path}
            pathLength={1}
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
        {!loading && !paths.length ? (
          <text x="54.5" y="68" textAnchor="middle" className={styles.strokeFallback}>
            {kanji.glyph}
          </text>
        ) : null}
      </svg>
      <div className={styles.strokePlayback}>
        <span>
          {loading ? 'Loading stroke paths…' : `${paths.length || kanji.strokes} strokes`}
        </span>
        <button onClick={() => setReplay((value) => value + 1)} disabled={!paths.length}>
          Replay
        </button>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11 4.5a1.5 1.5 0 0 1 3 0V11 6a1.5 1.5 0 0 1 3 0v6-3.5a1.5 1.5 0 0 1 3 0V15c0 4-2.5 7-7 7h-1.2c-2 0-3.5-.8-4.7-2.3L3.5 15a1.7 1.7 0 0 1 2.6-2.2L8 15.1" />
    </svg>
  )
}

function DrawIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="m13.5 7.5 3 3M4 20h6" />
    </svg>
  )
}

export function KanjiMap() {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null)
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null)
  const [query, setQuery] = useState('')
  const [mastery, setMastery] = useState<Record<string, Mastery>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [showDrawSearch, setShowDrawSearch] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  const positionRef = useRef(position)
  const gesturePointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{
    distance: number
    zoom: number
    mapX: number
    mapY: number
  } | null>(null)
  const pointerRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    moved: false,
    active: false,
  })

  useEffect(() => {
    zoomRef.current = zoom
    positionRef.current = position
  }, [position, zoom])

  const clampPosition = useCallback((next: { x: number; y: number }, nextZoom: number) => {
    const width = window.innerWidth
    const height = window.innerHeight
    const margin = 120
    return {
      x: Math.min(margin, Math.max(width - MAP_WIDTH * nextZoom - margin, next.x)),
      y: Math.min(margin, Math.max(height - MAP_HEIGHT * nextZoom - margin, next.y)),
    }
  }, [])

  const resetView = useCallback((nextZoom = 1) => {
    const x = (window.innerWidth - MAP_WIDTH * nextZoom) / 2
    const y = (window.innerHeight - MAP_HEIGHT * nextZoom) / 2 + 32
    setZoom(nextZoom)
    setPosition({ x, y })
  }, [])

  useEffect(() => {
    resetView()
  }, [resetView])

  useEffect(() => {
    const onResize = () => setPosition((current) => clampPosition(current, zoom))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampPosition, zoom])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedKanji(null)
        setSelectedRadical(null)
        setShowDrawSearch(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  const setZoomAroundPoint = (next: number, centerX: number, centerY: number) => {
    const clamped = Math.max(0.5, Math.min(2, Number(next.toFixed(2))))
    const currentZoom = zoomRef.current
    const currentPosition = positionRef.current
    const ratio = clamped / currentZoom
    const nextPosition = {
      x: centerX - (centerX - currentPosition.x) * ratio,
      y: centerY - (centerY - currentPosition.y) * ratio,
    }
    setZoom(clamped)
    setPosition(clampPosition(nextPosition, clamped))
  }

  const setZoomAroundCenter = (next: number) =>
    setZoomAroundPoint(next, window.innerWidth / 2, window.innerHeight / 2)

  const searchResult = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return null
    return allKanji.find(
      (kanji) =>
        kanji.glyph === clean ||
        kanji.meaning.toLowerCase().includes(clean) ||
        kanji.on.toLowerCase().includes(clean) ||
        kanji.kun.toLowerCase().includes(clean),
    )
  }, [query])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchResult) return
    setSelectedRadical(null)
    setSelectedKanji(searchResult)
    const index = CELLS.findIndex(
      (cell) => cell.kind === 'kanji' && cell.kanji.glyph === searchResult.glyph,
    )
    if (index >= 0) {
      const x = (index % COLS) * CELL + CELL / 2
      const y = Math.floor(index / COLS) * CELL + CELL / 2
      setPosition({
        x: window.innerWidth / 2 - x * zoom,
        y: window.innerHeight / 2 - y * zoom,
      })
    }
  }

  const selectKanji = (kanji: Kanji) => {
    if (pointerRef.current.moved) return
    setSelectedRadical(null)
    setSelectedKanji({ ...kanji, mastery: mastery[kanji.glyph] ?? kanji.mastery })
  }

  const selectRadical = (radical: Radical) => {
    if (pointerRef.current.moved) return
    setSelectedKanji(null)
    setSelectedRadical((current) => (current === radical ? null : radical))
  }

  const cycleMastery = () => {
    if (!selectedKanji) return
    const order: Mastery[] = ['unknown', 'learning', 'known']
    const current = mastery[selectedKanji.glyph] ?? selectedKanji.mastery
    const next = order[(order.indexOf(current) + 1) % order.length]
    setMastery((state) => ({ ...state, [selectedKanji.glyph]: next }))
    setSelectedKanji((kanji) => (kanji ? { ...kanji, mastery: next } : null))
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    gesturePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (gesturePointers.current.size === 2) {
      const [first, second] = [...gesturePointers.current.values()]
      const midpointX = (first.x + second.x) / 2
      const midpointY = (first.y + second.y) / 2
      pinchRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        zoom: zoomRef.current,
        mapX: (midpointX - positionRef.current.x) / zoomRef.current,
        mapY: (midpointY - positionRef.current.y) / zoomRef.current,
      }
      pointerRef.current.moved = true
      setIsDragging(true)
      setShowHint(false)
      for (const pointerId of gesturePointers.current.keys()) {
        if (!viewportRef.current?.hasPointerCapture(pointerId)) {
          viewportRef.current?.setPointerCapture(pointerId)
        }
      }
      return
    }

    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      active: true,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gesturePointers.current.has(event.pointerId)) {
      gesturePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    if (gesturePointers.current.size === 2 && pinchRef.current) {
      const [first, second] = [...gesturePointers.current.values()]
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const midpointX = (first.x + second.x) / 2
      const midpointY = (first.y + second.y) / 2
      const nextZoom = Math.max(
        0.5,
        Math.min(2, pinchRef.current.zoom * (distance / pinchRef.current.distance)),
      )
      setZoom(nextZoom)
      setPosition(
        clampPosition(
          {
            x: midpointX - pinchRef.current.mapX * nextZoom,
            y: midpointY - pinchRef.current.mapY * nextZoom,
          },
          nextZoom,
        ),
      )
      return
    }

    if (!pointerRef.current.active || pointerRef.current.pointerId !== event.pointerId) return

    const distance =
      Math.abs(event.clientX - pointerRef.current.startX) +
      Math.abs(event.clientY - pointerRef.current.startY)

    if (!pointerRef.current.moved && distance < 6) return

    if (!pointerRef.current.moved) {
      pointerRef.current.moved = true
      viewportRef.current?.setPointerCapture(event.pointerId)
      setIsDragging(true)
      setShowHint(false)
    }

    const dx = event.clientX - pointerRef.current.x
    const dy = event.clientY - pointerRef.current.y
    pointerRef.current.x = event.clientX
    pointerRef.current.y = event.clientY
    setPosition((current) => clampPosition({ x: current.x + dx, y: current.y + dy }, zoom))
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    gesturePointers.current.delete(event.pointerId)
    if (gesturePointers.current.size < 2) pinchRef.current = null
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId)
    }
    if (gesturePointers.current.size === 1) {
      const [pointerId, point] = [...gesturePointers.current.entries()][0]
      pointerRef.current = {
        pointerId,
        startX: point.x,
        startY: point.y,
        x: point.x,
        y: point.y,
        moved: true,
        active: true,
      }
      return
    }
    pointerRef.current.active = false
    setIsDragging(false)
    window.setTimeout(() => {
      pointerRef.current.moved = false
    }, 0)
  }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setShowHint(false)
    if (event.ctrlKey || event.metaKey) {
      setZoomAroundPoint(zoomRef.current - event.deltaY * 0.002, event.clientX, event.clientY)
      return
    }
    setPosition((current) =>
      clampPosition(
        {
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        },
        zoomRef.current,
      ),
    )
  }

  const activeMastery = selectedKanji
    ? (mastery[selectedKanji.glyph] ?? selectedKanji.mastery)
    : null

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.seal}>漢</div>
          <div>
            <strong>Kanji Map</strong>
            <span>漢字図 · Radical atlas</span>
          </div>
        </div>

        <div className={styles.searchCluster}>
          <form className={styles.search} onSubmit={submitSearch}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search kanji, reading, or meaning"
              aria-label="Search the kanji map"
            />
            <kbd>↵</kbd>
            {query && (
              <div className={styles.searchPreview}>
                {searchResult ? (
                  <>
                    <span>{searchResult.glyph}</span>
                    <div>
                      <strong>{searchResult.meaning}</strong>
                      <small>{searchResult.radical.meaning} family</small>
                    </div>
                  </>
                ) : (
                  <p>No kanji found in this map.</p>
                )}
              </div>
            )}
          </form>
          <button
            className={styles.drawTrigger}
            onClick={() => setShowDrawSearch((visible) => !visible)}
            aria-pressed={showDrawSearch}
            aria-label="Search by drawing"
          >
            <DrawIcon />
            <span>Draw</span>
          </button>
        </div>

        <div className={styles.legend} aria-label="Mastery legend">
          {(['known', 'learning', 'unknown'] as Mastery[]).map((item) => (
            <span key={item}>
              <i className={styles[item]} />
              {masteryLabels[item]}
            </span>
          ))}
        </div>
      </header>

      {showDrawSearch ? (
        <DrawingSearch
          onClose={() => setShowDrawSearch(false)}
          onSelect={(kanji) => {
            setSelectedRadical(null)
            setSelectedKanji(kanji)
          }}
        />
      ) : null}

      <div
        ref={viewportRef}
        className={`${styles.viewport} ${isDragging ? styles.dragging : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className={styles.map}
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
          }}
        >
          {CELLS.map((cell, index) => {
            const x = index % COLS
            const y = Math.floor(index / COLS)
            if (cell.kind === 'radical') {
              const active = selectedRadical === cell.radical
              return (
                <button
                  className={`${styles.tile} ${styles.radicalTile} ${active ? styles.radicalActive : ''}`}
                  key={cell.key}
                  onClick={() => selectRadical(cell.radical)}
                  aria-label={`${cell.radical.meaning} radical`}
                  style={{ '--delay': `${(x + y) % 9}` } as React.CSSProperties}
                >
                  <span className={styles.radicalGlyph} lang="ja">
                    {cell.radical.glyph}
                  </span>
                  <small>{cell.radical.meaning}</small>
                  <em>RADICAL</em>
                </button>
              )
            }

            const status = mastery[cell.kanji.glyph] ?? cell.kanji.mastery
            const isMatch = !selectedRadical || selectedRadical === cell.kanji.radical
            const isSelected = selectedKanji?.glyph === cell.kanji.glyph
            return (
              <button
                className={`${styles.tile} ${styles.kanjiTile} ${styles[status]} ${
                  !isMatch ? styles.dimmed : ''
                } ${isSelected ? styles.selected : ''}`}
                key={cell.key}
                onClick={() => selectKanji(cell.kanji)}
                aria-label={`${cell.kanji.glyph}, ${cell.kanji.meaning}, ${masteryLabels[status]}`}
                style={{ '--delay': `${(x + y) % 9}` } as React.CSSProperties}
              >
                <span lang="ja">{cell.kanji.glyph}</span>
                <small>{cell.kanji.meaning.split(' / ')[0]}</small>
              </button>
            )
          })}
        </div>
      </div>

      {showHint && (
        <div className={styles.dragHint}>
          <HandIcon />
          <span>
            <strong>Drag to explore</strong>
            The map extends beyond the screen
          </span>
        </div>
      )}

      <div className={styles.coordinates}>
        <span>RADICAL SPACE</span>
        <strong>
          {Math.round(-position.x / (CELL * zoom))}.{Math.round(-position.y / (CELL * zoom))}
        </strong>
      </div>

      <div className={styles.zoomControls}>
        <button onClick={() => setZoomAroundCenter(zoom + 0.1)} aria-label="Zoom in">
          +
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoomAroundCenter(zoom - 0.1)} aria-label="Zoom out">
          −
        </button>
        <button onClick={() => resetView(1)} aria-label="Reset map position">
          <LocateIcon />
        </button>
      </div>

      {selectedRadical && (
        <aside className={`${styles.callout} ${styles.radicalCallout}`}>
          <button
            className={styles.close}
            onClick={() => setSelectedRadical(null)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <span className={styles.eyebrow}>Radical cluster · 214 dimensions</span>
          <div className={styles.radicalHero}>
            <span lang="ja">{selectedRadical.glyph}</span>
            <div>
              <h2>{selectedRadical.meaning}</h2>
              <p>{selectedRadical.label}</p>
            </div>
          </div>
          <p className={styles.calloutCopy}>
            A visual family centered on the <strong>{selectedRadical.meaning}</strong> component.
            Matching kanji stay bright while the rest of the map recedes.
          </p>
          <div className={styles.familyGrid}>
            {allKanji
              .filter((kanji) => kanji.radical === selectedRadical)
              .map((kanji) => (
                <button key={kanji.glyph} onClick={() => selectKanji(kanji)}>
                  <span lang="ja">{kanji.glyph}</span>
                  <small>{kanji.meaning.split(' / ')[0]}</small>
                </button>
              ))}
          </div>
          <button className={styles.clearFilter} onClick={() => setSelectedRadical(null)}>
            Show the whole map
          </button>
        </aside>
      )}

      {selectedKanji && (
        <aside className={styles.callout}>
          <button
            className={styles.close}
            onClick={() => setSelectedKanji(null)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <div className={styles.kanjiHeader}>
            <div className={`${styles.kanjiHero} ${styles[activeMastery ?? 'unknown']}`} lang="ja">
              {selectedKanji.glyph}
            </div>
            <div>
              <span className={styles.eyebrow}>Kanji · {selectedKanji.strokes} strokes</span>
              <h2>{selectedKanji.meaning}</h2>
              <button
                className={styles.radicalPill}
                onClick={() => selectRadical(selectedKanji.radical)}
              >
                <b lang="ja">{selectedKanji.radical.glyph}</b>
                {selectedKanji.radical.meaning} radical
              </button>
            </div>
          </div>

          <div className={styles.readings}>
            <div>
              <span>ON READING</span>
              <strong>{selectedKanji.on}</strong>
            </div>
            <div>
              <span>KUN READING</span>
              <strong>{selectedKanji.kun}</strong>
            </div>
          </div>

          <div className={styles.strokeSection}>
            <div className={styles.sectionTitle}>
              <span>Stroke order</span>
              <em>{selectedKanji.strokes} strokes</em>
            </div>
            <AnimatedStrokeOrder kanji={selectedKanji} />
          </div>

          <div className={styles.progressRow}>
            <div>
              <span>YOUR PROGRESS</span>
              <strong>{masteryLabels[activeMastery ?? 'unknown']}</strong>
            </div>
            <button className={styles.progressButton} onClick={cycleMastery}>
              Mark next
              <span>↗</span>
            </button>
          </div>

          <div className={styles.example}>
            <span>MAP RELATION</span>
            <p>
              Near <b lang="ja">{selectedKanji.radical.glyph}</b> because the form carries the{' '}
              {selectedKanji.radical.meaning} component.
            </p>
          </div>
        </aside>
      )}
    </main>
  )
}
