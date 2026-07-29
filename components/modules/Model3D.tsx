'use client'

/* model_3d — the interactive viewer.
 *
 * The catalogue's rich renderer: automatic rotation, drag to rotate, scroll
 * or pinch to zoom, a `Loading 3D model…` state and a thumbnail fallback when
 * rendering fails. §9.3C's carve-out for a WebGL canvas is what permits this,
 * and the carve-out is all-or-nothing, so all of its terms are met here:
 *
 *   · Keyboard rotation. Arrow keys turn it, +/− zoom, Home resets — the
 *     canvas is focusable and documents its own controls.
 *   · Announced orientation. Rotation is reported as a named face in a live
 *     region, not as radians, and only once it settles.
 *   · The objective survives without the canvas: `reveals` is a written
 *     account of what turning the model shows, and the poster carries real
 *     alt text. A learner who never rotates anything still gets the content.
 *
 * Orientation lives in a REF, not in state. A spinning model that set state
 *每 frame would re-render the whole card sixty times a second; the ref is
 * read by the render loop, and only the announcement samples it — on a timer,
 * which is also the only rate at which an announcement is useful.
 */

import {
  Component,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader, STLLoader } from 'three-stdlib'
import * as THREE from 'three'
import type { Figure } from '@/lib/api/types'

type ModelFigure = Extract<Figure, { kind: 'model' }>

interface View {
  yaw: number
  zoom: number
  spinning: boolean
}

export function Model3D({ figure }: { figure: ModelFigure }) {
  const [live, setLive] = useState(false)
  const [spinning, setSpinning] = useState(true)
  const [face, setFace] = useState('front')
  const view = useRef<View>({ yaw: 0, zoom: 2.6, spinning: true })
  const howToId = useId()

  view.current.spinning = spinning

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setFace(named(view.current.yaw)), 500)
    return () => clearInterval(id)
  }, [live])

  /* The still. Also the pre-interaction state: a card in a scrolling feed
   * that boots a WebGL context on sight costs a context per card, and most
   * are scrolled past. The learner asks for the viewer. */
  if (!figure.src || !live) {
    return (
      <figure className="k-fig k-fig--model">
        <img src={figure.poster} alt={figure.alt} />
        <figcaption>
          <p>{figure.reveals}</p>
          {figure.src ? (
            <button
              type="button"
              className="k-btn k-btn--secondary k-press"
              onClick={() => setLive(true)}
            >
              Turn the model
            </button>
          ) : null}
          <Credit figure={figure} />
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className="k-fig k-fig--model">
      <div
        className="k-model"
        tabIndex={0}
        role="img"
        aria-label={figure.alt}
        aria-describedby={howToId}
        onKeyDown={(e) => {
          const v = view.current
          const step = Math.PI / 12
          if (e.key === 'ArrowLeft') v.yaw -= step
          else if (e.key === 'ArrowRight') v.yaw += step
          else if (e.key === '+' || e.key === '=') v.zoom = Math.max(1.4, v.zoom - 0.3)
          else if (e.key === '-') v.zoom = Math.min(6, v.zoom + 0.3)
          else if (e.key === 'Home') {
            v.yaw = 0
            v.zoom = 2.6
          } else return
          e.preventDefault()
          setSpinning(false)
          setFace(named(v.yaw))
        }}
      >
        <ModelBoundary fallback={<img src={figure.poster} alt={figure.alt} />}>
          <Canvas camera={{ position: [0, 0.6, 2.6], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 4, 2]} intensity={1.1} />
            <Suspense fallback={null}>
              {figure.src.toLowerCase().endsWith('.stl') ? (
                <StlModel src={figure.src} view={view} />
              ) : (
                <GltfModel src={figure.src} view={view} />
              )}
            </Suspense>
            <Rig view={view} onInteract={() => setSpinning(false)} />
          </Canvas>
        </ModelBoundary>
      </div>

      <figcaption>
        <p className="k-sr" id={howToId}>
          Drag to turn it, scroll to zoom. From the keyboard: arrows turn, <kbd>+</kbd>/<kbd>−</kbd>{' '}
          zoom, <kbd>Home</kbd> resets.
        </p>
        <p className="k-sr" aria-live="polite">
          Showing the {face}.
        </p>
        <div className="k-model__controls">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            aria-pressed={spinning}
            onClick={() => setSpinning((s) => !s)}
          >
            {spinning ? 'Stop turning' : 'Turn automatically'}
          </button>
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => setLive(false)}
          >
            Show the still
          </button>
        </div>
        <p>{figure.reveals}</p>
        <Credit figure={figure} />
      </figcaption>
    </figure>
  )
}

function Credit({ figure }: { figure: ModelFigure }) {
  if (!figure.attribution) return null
  return (
    <p className="k-credit">
      {figure.attribution}
      {figure.license ? ` · ${figure.license}` : ''}
    </p>
  )
}

/** Radians to something a person can act on. */
function named(yaw: number): string {
  const turns = (((yaw / (Math.PI * 2)) % 1) + 1) % 1
  return ['front', 'right side', 'back', 'left side'][Math.round(turns * 4) % 4]
}

/* Two components rather than two loaders in one: `useLoader` suspends, and a
 * hook that only sometimes runs is not a hook. Each renders exactly one. */

function GltfModel({ src, view }: { src: string; view: MutableRefObject<View> }) {
  const gltf = useLoader(GLTFLoader, src)
  return (
    <Spin view={view}>
      <primitive object={gltf.scene} />
    </Spin>
  )
}

function StlModel({ src, view }: { src: string; view: MutableRefObject<View> }) {
  const geometry = useLoader(STLLoader, src)
  return (
    <Spin view={view}>
      <mesh geometry={geometry} scale={0.02}>
        <meshStandardMaterial color="#b8c5d4" roughness={0.55} metalness={0.1} />
      </mesh>
    </Spin>
  )
}

function Spin({ view, children }: { view: MutableRefObject<View>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (view.current.spinning) view.current.yaw += delta * 0.4
    if (group.current) group.current.rotation.y = view.current.yaw
  })
  return <group ref={group}>{children}</group>
}

/** Pointer and wheel handling, inside the canvas so it sees canvas events. */
function Rig({ view, onInteract }: { view: MutableRefObject<View>; onInteract: () => void }) {
  const { camera, gl } = useThree()

  useFrame(() => {
    if (Math.abs(camera.position.z - view.current.zoom) > 0.001) {
      camera.position.z = view.current.zoom
    }
  })

  useEffect(() => {
    const el = gl.domElement
    let last: number | null = null
    const down = (e: PointerEvent) => {
      last = e.clientX
      el.setPointerCapture(e.pointerId)
      onInteract()
    }
    const move = (e: PointerEvent) => {
      if (last === null) return
      view.current.yaw += (e.clientX - last) * 0.01
      last = e.clientX
    }
    const up = () => (last = null)
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      view.current.zoom = Math.min(6, Math.max(1.4, view.current.zoom + e.deltaY * 0.002))
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl, view, onInteract])

  return null
}

/* A model that fails to parse must not blank the card. The catalogue calls
 * for a thumbnail fallback and this is it — the poster is already required,
 * so the failure state costs nothing extra to serve. */
class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
