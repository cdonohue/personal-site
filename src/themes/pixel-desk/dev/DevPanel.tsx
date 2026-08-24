import { useEffect, useMemo, useRef, useState } from 'react'
import { createDeskRoom, type DeskRoom } from '../scene/mount'
import type { Posture } from '../scene/render'
import { PLAY_TAGS, SCREENSAVER_TAGS, WORK_TAGS } from '../scene/render'
import { OUTFITS, type Outfit } from '../scene/outfits'
import { DEFAULT_VALUES, LIVE_TOGGLES, type ToggleValues } from '../scene/toggles'
import { roll, type Activity } from '../activity'

/**
 * The workbench.
 *
 * Only ever served by `astro dev` — see `devRoom` in astro.config.mjs. It
 * mounts the scene directly rather than reusing DeskScene, because DeskScene's
 * whole job is to decide these values from the clock and the weather, and the
 * point here is to override them.
 *
 * Nothing persists. The customiser's output is a block of TypeScript to paste
 * into `outfits.ts`, which keeps the file the only place an outfit lives; a
 * panel that remembered its own state would be a second source of truth that
 * nobody ever reconciles.
 */

const SCREEN_GROUPS = [
  { label: 'work', tags: WORK_TAGS },
  { label: 'play', tags: PLAY_TAGS },
  { label: 'screensaver', tags: SCREENSAVER_TAGS },
] as const

/** The nine editable colours, in the order `outfits.ts` lists its keys. */
const PARTS = [
  { group: 'hat', key: 'top', label: 'top' },
  { group: 'hat', key: 'edge', label: 'edge' },
  { group: 'hat', key: 'strap', label: 'strap' },
  { group: 'shirt', key: 'fill', label: 'fill' },
  { group: 'shirt', key: 'shade', label: 'shade' },
  { group: 'pants', key: 'fill', label: 'fill' },
  { group: 'pants', key: 'shade', label: 'shade' },
  { group: 'shoes', key: 'fill', label: 'fill' },
  { group: 'shoes', key: 'shade', label: 'shade' },
] as const

type Part = (typeof PARTS)[number]

const read = (outfit: Outfit, part: Part): string =>
  (outfit[part.group] as Record<string, string>)[part.key]

const write = (outfit: Outfit, part: Part, value: string): Outfit => ({
  ...outfit,
  [part.group]: { ...outfit[part.group], [part.key]: value },
})

/** The outfit as it would be written in `outfits.ts`, ready to paste. */
const asSource = (outfit: Outfit): string =>
  [
    `  {`,
    `    name: '${outfit.name}',`,
    `    hat: { top: '${outfit.hat.top}', edge: '${outfit.hat.edge}', strap: '${outfit.hat.strap}' },`,
    outfit.shirt.logo
      ? `    shirt: { fill: '${outfit.shirt.fill}', shade: '${outfit.shirt.shade}', logo: { art: '${outfit.shirt.logo.art}', ink: '${outfit.shirt.logo.ink}' } },`
      : `    shirt: { fill: '${outfit.shirt.fill}', shade: '${outfit.shirt.shade}' },`,
    `    pants: { fill: '${outfit.pants.fill}', shade: '${outfit.pants.shade}' },`,
    `    shoes: { fill: '${outfit.shoes.fill}', shade: '${outfit.shoes.shade}' },`,
    `  },`,
  ].join('\n')

export default function DevPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<DeskRoom | null>(null)

  const [values, setValues] = useState<ToggleValues>({ ...DEFAULT_VALUES, presence: 'present' })
  const [outfit, setOutfit] = useState<Outfit>(OUTFITS[0])
  const [posture, setPostureState] = useState<Posture>('seated')
  const [rolled, setRolled] = useState<Activity | null>(null)
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  // Mounted once. Everything after this goes through set(), toggleDesk() and
  // setOutfit(), because remounting would throw away desk height and cable
  // state on every colour nudge.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let scene: DeskRoom | null = null
    let cancelled = false

    createDeskRoom(canvas, {
      values,
      outfit,
      // Never inherit the visitor's setting here: reduced motion freezes the
      // loops, and a frozen scene is not what anyone opens this page to look at.
      reducedMotion: false,
    })
      .then((created) => {
        if (cancelled) return
        scene = created
        sceneRef.current = created
        created.start()
      })
      .catch((error: unknown) => setFailed(String(error)))

    return () => {
      cancelled = true
      scene?.stop()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => sceneRef.current?.set(values), [values])
  useEffect(() => sceneRef.current?.setOutfit(outfit), [outfit])
  useEffect(() => sceneRef.current?.setPosture(posture), [posture])

  const source = useMemo(() => asSource(outfit), [outfit])

  const copy = () => {
    navigator.clipboard.writeText(source).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      },
      () => setFailed('clipboard refused; select the text instead'),
    )
  }

  const label = 'text-xs uppercase tracking-wide opacity-60'
  const field = 'w-full rounded border border-white/15 bg-black/30 px-2 py-1 text-sm'
  const button = 'rounded border border-white/20 px-3 py-1 text-sm hover:bg-white/10'

  return (
    <div className="min-h-screen bg-[#1b1b1e] p-6 text-white" style={{ colorScheme: 'dark' }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="lg:w-3/5">
          <canvas
            ref={canvasRef}
            className="block w-full [image-rendering:pixelated]"
            style={{ aspectRatio: '192 / 108' }}
          />
          {failed && <p className="mt-2 text-sm text-red-400">{failed}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={button}
              onClick={() => {
                // Performs the change, sequence and all. Kept alongside the
                // posture control because watching it happen and arriving in it
                // are two different things to be able to check.
                sceneRef.current?.toggleDesk()
                setPostureState((current) => (current === 'seated' ? 'standing' : 'seated'))
              }}
            >
              play the stand / sit
            </button>
            <button className={button} onClick={() => sceneRef.current?.toggleCable()}>
              unplug / plug in
            </button>
            <button
              className={button}
              onClick={() => {
                const next = roll(new Date())
                setRolled(next)
                setValues((current) => ({
                  ...current,
                  presence: next.presence,
                  screen: next.screen,
                }))
                setOutfit(next.outfit)
                setPostureState(next.posture)
              }}
            >
              roll the schedule
            </button>
          </div>
          {rolled && (
            <p className="mt-2 text-xs opacity-60">
              rolled: {rolled.presence} · {rolled.screen} · {rolled.posture} · {rolled.outfit.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:w-2/5">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Scene</h2>
            <div className="grid grid-cols-2 gap-3">
              {LIVE_TOGGLES.map((toggle) => (
                <label key={toggle.id} className="flex flex-col gap-1">
                  <span className={label}>{toggle.label}</span>
                  <select
                    className={field}
                    value={String(values[toggle.id])}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [toggle.id]: event.target.value }))
                    }
                  >
                    {toggle.options.map((option) => (
                      <option key={String(option)} value={String(option)}>
                        {String(option)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="flex flex-col gap-1">
                <span className={label}>Posture</span>
                <select
                  className={field}
                  value={posture}
                  onChange={(event) => setPostureState(event.target.value as Posture)}
                >
                  <option value="seated">seated</option>
                  <option value="standing">standing</option>
                </select>
              </label>

              <label className="col-span-2 flex flex-col gap-1">
                <span className={label}>on screen</span>
                <select
                  className={field}
                  value={values.screen}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, screen: event.target.value }))
                  }
                >
                  {/* Grouped from the three lists in render.ts, so a screen added
                      there shows up here without this file being touched. */}
                  {SCREEN_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.tags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Outfit</h2>
              <select
                className="rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                value={outfit.name}
                onChange={(event) => {
                  const found = OUTFITS.find((candidate) => candidate.name === event.target.value)
                  if (found) setOutfit(found)
                }}
              >
                {OUTFITS.map((candidate) => (
                  <option key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="mb-3 flex flex-col gap-1">
              <span className={label}>name</span>
              <input
                className={field}
                value={outfit.name}
                onChange={(event) =>
                  setOutfit((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <div className="grid grid-cols-3 gap-x-3 gap-y-2">
              {PARTS.map((part) => (
                <label key={`${part.group}-${part.key}`} className="flex flex-col gap-1">
                  <span className={label}>
                    {part.group} {part.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      className="h-7 w-7 rounded border border-white/15 bg-transparent"
                      value={read(outfit, part)}
                      onChange={(event) =>
                        setOutfit((current) => write(current, part, event.target.value))
                      }
                    />
                    <input
                      className="w-full rounded border border-white/15 bg-black/30 px-1 py-0.5 font-mono text-xs"
                      value={read(outfit, part)}
                      onChange={(event) =>
                        setOutfit((current) => write(current, part, event.target.value))
                      }
                    />
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
              <label className="col-span-2 flex flex-col gap-1">
                <span className={label}>shirt logo — art/logo-NAME.png</span>
                <input
                  className={field}
                  placeholder="none"
                  value={outfit.shirt.logo?.art ?? ''}
                  onChange={(event) => {
                    const art = event.target.value.trim()
                    setOutfit((current) => ({
                      ...current,
                      shirt: {
                        fill: current.shirt.fill,
                        shade: current.shirt.shade,
                        // Dropping the field entirely rather than keeping an
                        // empty name, so the pasted source stays clean.
                        ...(art ? { logo: { art, ink: current.shirt.logo?.ink ?? '#1a0e09' } } : {}),
                      },
                    }))
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={label}>ink</span>
                <span className="flex items-center gap-1">
                  <input
                    type="color"
                    className="h-7 w-7 rounded border border-white/15 bg-transparent"
                    value={outfit.shirt.logo?.ink ?? '#1a0e09'}
                    disabled={!outfit.shirt.logo}
                    onChange={(event) =>
                      setOutfit((current) =>
                        current.shirt.logo
                          ? {
                              ...current,
                              shirt: {
                                ...current.shirt,
                                logo: { ...current.shirt.logo, ink: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                  />
                  <input
                    className="w-full rounded border border-white/15 bg-black/30 px-1 py-0.5 font-mono text-xs"
                    value={outfit.shirt.logo?.ink ?? ''}
                    placeholder="—"
                    disabled={!outfit.shirt.logo}
                    onChange={(event) =>
                      setOutfit((current) =>
                        current.shirt.logo
                          ? {
                              ...current,
                              shirt: {
                                ...current.shirt,
                                logo: { ...current.shirt.logo, ink: event.target.value },
                              },
                            }
                          : current,
                      )
                    }
                  />
                </span>
              </label>
            </div>

            <p className="mt-2 text-xs opacity-50">
              A logo is 14x14, alpha is the shape, and the ink colours it. Only really visible
              standing — the chair hides 86% of the shirt.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button className={button} onClick={copy}>
                {copied ? 'copied' : 'copy for outfits.ts'}
              </button>
              <span className="text-xs opacity-50">paste into OUTFITS</span>
            </div>

            <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[11px] leading-snug">
              {source}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
