'use client'

import { useState, type ReactNode } from 'react'
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import {
  TEXTS,
  type Challenge,
  type Genre,
  type LengthTier,
  type ReaderText,
  type Register,
} from '@/lib/api/jkg'

const GENRES: Array<{ id: Genre; label: string }> = [
  { id: 'conversation', label: 'Conversation' },
  { id: 'history', label: 'Japanese history' },
  { id: 'folk_tale', label: 'Folk tale' },
]
const LENGTHS: Array<{ id: LengthTier; label: string }> = [
  { id: 'tiny', label: 'Tiny' },
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
]
const CHALLENGES: Array<{ id: Challenge; label: string }> = [
  { id: 'easier', label: 'Easier' },
  { id: 'current', label: 'Current' },
  { id: 'stretch', label: 'Stretch' },
]
const REGISTERS: Array<{ id: Register; label: string }> = [
  { id: 'casual', label: 'Casual' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'formal', label: 'Formal' },
]

export function TextLab({ children }: { children: (text: ReaderText) => ReactNode }) {
  const [library, setLibrary] = useState<ReaderText[]>(TEXTS)
  const [selected, setSelected] = useState<string>(TEXTS[0]?.textId ?? '')
  const [genre, setGenre] = useState<Genre>('conversation')
  const [length, setLength] = useState<LengthTier>('short')
  const [challenge, setChallenge] = useState<Challenge>('current')
  const [register, setRegister] = useState<Register>('neutral')
  const [topic, setTopic] = useState('')
  const [useFocus, setUseFocus] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [upload, setUpload] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')

  const text = library.find((item) => item.textId === selected)

  const addText = (title?: string) => {
    const source = library[0] ?? TEXTS[0]
    if (!source) return
    const copy: ReaderText = {
      ...source,
      textId: `text-${Date.now()}`,
      genre,
      lengthTier: length,
      challenge,
      register,
      title: title || topic || source.title,
      titleEn: title || topic || source.titleEn,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setLibrary((current) => [copy, ...current])
    setSelected(copy.textId)
  }

  const generate = (close: () => void) => {
    setGenerating(true)
    window.setTimeout(() => {
      addText()
      setGenerating(false)
      close()
    }, 600)
  }

  const processUpload = (close: () => void) => {
    if (!upload) return
    setGenerating(true)
    setUploadStatus('Preparing the text for AI processing…')
    window.setTimeout(() => {
      addText(upload.name.replace(/\.[^.]+$/, ''))
      setGenerating(false)
      setUpload(null)
      setUploadStatus('')
      close()
    }, 600)
  }

  return (
    <div className="k-lab">
      <section className="k-lab__library" aria-label="Available texts">
        <div className="k-section-row">
          <div>
            <p className="k-meta">Library</p>
            <h2 className="k-h3">Available texts</h2>
          </div>
          <span className="k-meta">{library.length}</span>
        </div>
        <ul>
          {library.map((item) => (
            <li key={item.textId}>
              <button
                type="button"
                className="k-btn k-btn--quiet k-press"
                aria-current={item.textId === selected ? 'true' : undefined}
                data-current={item.textId === selected ? 'true' : undefined}
                onClick={() => setSelected(item.textId)}
              >
                <span lang="ja">{item.title}</span>
                <small className="k-meta">
                  {item.titleEn} · {item.targetLevel} · {item.wordCount} words
                </small>
              </button>
              <button
                type="button"
                className="k-btn k-btn--quiet k-press"
                onClick={() => {
                  const next = library.filter((candidate) => candidate.textId !== item.textId)
                  setLibrary(next)
                  if (selected === item.textId) setSelected(next[0]?.textId ?? '')
                }}
              >
                <span aria-hidden="true">×</span>
                <span className="k-sr">Delete text {item.titleEn}</span>
              </button>
            </li>
          ))}
        </ul>

        <DialogTrigger>
          <Button className="k-btn k-btn--secondary k-press k-new-text">+ New Text</Button>
          <ModalOverlay className="k-scrim">
            <Modal>
              <Dialog className="k-dialog k-new-text-dialog">
                {({ close }) => (
                  <>
                    <div className="k-dialog__head">
                      <div>
                        <p className="k-meta">Text library</p>
                        <Heading slot="title" className="k-h2">
                          New text
                        </Heading>
                      </div>
                      <Button className="k-icon-close k-press" onPress={close}>
                        <span aria-hidden="true">×</span>
                        <span className="k-sr">Close</span>
                      </Button>
                    </div>

                    <div className="k-new-text-dialog__settings">
                      <SettingRow
                        label="Genre"
                        value={genre}
                        onChange={setGenre}
                        options={GENRES}
                      />
                      <SettingRow
                        label="Length"
                        value={length}
                        onChange={setLength}
                        options={LENGTHS}
                      />
                      <SettingRow
                        label="Challenge"
                        value={challenge}
                        onChange={setChallenge}
                        options={CHALLENGES}
                      />
                      <SettingRow
                        label="Register"
                        value={register}
                        onChange={setRegister}
                        options={REGISTERS}
                      />

                      <label className="k-setting-row">
                        <span className="k-field__label">Topic</span>
                        <input
                          className="k-input"
                          value={topic}
                          onChange={(event) => setTopic(event.target.value)}
                          placeholder="Optional"
                        />
                      </label>

                      <div className="k-setting-row">
                        <span className="k-field__label">Today’s lesson</span>
                        <button
                          type="button"
                          className="k-btn k-btn--secondary k-press"
                          aria-pressed={useFocus}
                          onClick={() => setUseFocus((current) => !current)}
                        >
                          {useFocus ? 'Use focus items' : 'Do not use'}
                        </button>
                      </div>
                    </div>

                    <div className="k-dialog__actions">
                      <Button className="k-btn k-btn--secondary k-press" onPress={close}>
                        Cancel
                      </Button>
                      <Button
                        className="k-btn k-btn--primary k-press"
                        isDisabled={generating}
                        onPress={() => generate(close)}
                      >
                        {generating && !upload ? 'Generating…' : 'Generate text'}
                      </Button>
                    </div>

                    <section className="k-upload-row" aria-label="Upload a text">
                      <div>
                        <h3 className="k-h3">Upload a text</h3>
                        <p className="k-meta">TXT, DOCX, or PDF · processed by AI after upload</p>
                      </div>
                      <label className="k-btn k-btn--secondary k-press">
                        {upload ? upload.name : 'Choose file'}
                        <input
                          className="k-sr"
                          type="file"
                          accept=".txt,.doc,.docx,.pdf,text/plain,application/pdf"
                          onChange={(event) => {
                            setUpload(event.target.files?.[0] ?? null)
                            setUploadStatus('')
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="k-btn k-btn--primary k-press"
                        disabled={!upload || generating}
                        onClick={() => processUpload(close)}
                      >
                        Process text
                      </button>
                    </section>
                    {uploadStatus ? (
                      <p className="k-meta" aria-live="polite">
                        {uploadStatus}
                      </p>
                    ) : null}
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      </section>

      <div className="k-lab__stage">
        {text ? children(text) : <p>No text selected. Add a new text to begin.</p>}
      </div>
    </div>
  )
}

function SettingRow<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ id: T; label: string }>
}) {
  return (
    <div className="k-setting-row">
      <span className="k-field__label">{label}</span>
      <div className="k-setting-row__options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="k-btn k-btn--secondary k-press"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
