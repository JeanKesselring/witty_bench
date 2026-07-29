'use client'

/* The media player — audio and video, §6.9.
 *
 * Custom rather than `controls`, because the native control bar is the one
 * piece of UI in the product that cannot be made to obey the type scale, the
 * 8px grid or the focus ring, and it looks different in every browser. What
 * a custom player owes in return is everything the native one gave for free,
 * so all of it is here: play/pause, seek with a real range input, elapsed and
 * total time, volume, playback rate, fullscreen for video, and keyboard
 * operation of every one of them.
 *
 * Captions are not optional on video: §9.3 makes them a publishing gate, so
 * a video with a `captions` track renders it and one without says so rather
 * than staying silent about it.
 *
 * Preload follows the catalogue: `none` for audio, `metadata` for video, so
 * a feed of media cards costs a request each rather than a download each.
 */

import { useEffect, useRef, useState } from 'react'
import type { Figure } from '@/lib/api/types'
import { untilFound } from '@/components/deck/Japanese'

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export function MediaPlayer({ figure }: { figure: Extract<Figure, { kind: 'media' }> }) {
  const ref = useRef<HTMLMediaElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [failed, setFailed] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el) {
      el.playbackRate = rate
      el.volume = volume
    }
  }, [rate, volume])

  const video = figure.media === 'video'

  const shared = {
    ref: ref as never,
    src: figure.src,
    preload: video ? ('metadata' as const) : ('none' as const),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onError: () => setFailed(true),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
  }

  return (
    <div className="k-fig k-fig--media">
      <div className="k-player">
        {video ? (
          <video {...shared} poster={figure.poster} playsInline>
            {figure.captions ? (
              <track kind="captions" src={figure.captions} srcLang="en" label="English" default />
            ) : null}
          </video>
        ) : (
          <audio {...shared} />
        )}
      </div>

      {failed ? (
        <p className="k-judge k-judge--err">
          This {figure.media} could not be played.
          {figure.transcript ? ' The transcript below has the same content.' : ''}
        </p>
      ) : null}

      <div className="k-player__controls">
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          onClick={() => {
            const el = ref.current
            if (!el) return
            if (el.paused) el.play().catch(() => setFailed(true))
            else el.pause()
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>

        <label className="k-player__seek">
          <span className="k-sr">Seek</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            onChange={(e) => {
              const el = ref.current
              if (el) el.currentTime = Number(e.target.value)
              setTime(Number(e.target.value))
            }}
          />
        </label>

        <span className="k-meta k-player__time">
          {clock(time)} / {clock(duration)}
        </span>

        <label className="k-player__vol">
          <span className="k-sr">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="k-sr">Playback speed</span>
          <select
            className="k-input"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>

        {video ? (
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => {
              const el = ref.current as HTMLVideoElement | null
              el?.requestFullscreen?.().catch(() => {})
            }}
          >
            Fullscreen
          </button>
        ) : null}

        {figure.transcript ? (
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            aria-expanded={showTranscript}
            onClick={() => setShowTranscript((s) => !s)}
          >
            {showTranscript ? 'Hide transcript' : 'Transcript'}
          </button>
        ) : null}
      </div>

      {video && !figure.captions ? (
        <p className="k-meta">Captions unavailable · transcript provided</p>
      ) : null}

      {figure.transcript ? (
        <div className="k-audio__transcript" {...untilFound(!showTranscript)}>
          <p>{figure.transcript}</p>
        </div>
      ) : null}
    </div>
  )
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
