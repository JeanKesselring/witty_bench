'use client'

import { useRef, useState } from 'react'
import {
  ANALYSIS,
  CONVERSATIONS,
  PLAN,
  SCENARIOS,
  type Conversation,
  type Scenario,
} from '@/lib/api/jkg'
import {
  FuriganaProvider,
  FuriganaToggle,
  Ruby,
  type FuriganaMode,
} from '@/components/deck/Japanese'

export function TutorChat() {
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS)
  const [current, setCurrent] = useState<string>(CONVERSATIONS[0]?.conversationId ?? '')
  const [scenario, setScenario] = useState<Scenario>('daily_life')
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState(false)
  const [translations, setTranslations] = useState(true)
  const [furigana, setFurigana] = useState<FuriganaMode>('all')
  const [useTodayTopic, setUseTodayTopic] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analysis, setAnalysis] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechStatus, setSpeechStatus] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)

  const conversation = conversations.find((candidate) => candidate.conversationId === current)

  const createConversation = () => {
    const title = useTodayTopic
      ? PLAN.theme
      : (SCENARIOS.find((candidate) => candidate.id === scenario)?.label ?? 'New conversation')
    const fresh: Conversation = {
      conversationId: `conv-${Date.now()}`,
      scenario,
      title,
      turns: useTodayTopic
        ? [
            {
              role: 'tutor',
              text: '今日は駅への行き方について話しましょう。',
              translation: 'Today, let’s talk about finding your way to the station.',
            },
          ]
        : [],
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    setConversations((currentConversations) => [fresh, ...currentConversations])
    setCurrent(fresh.conversationId)
    setAnalysis(false)
  }

  const send = () => {
    if (!draft.trim() || !conversation) return
    const learnerText = draft
    const reply = {
      role: 'tutor' as const,
      text: useTodayTopic
        ? 'そうですね。駅に着いたら、まず何をしますか。'
        : 'いいですね。もう少し詳しく話してください。',
      translation: useTodayTopic
        ? 'That’s right. What will you do first when you arrive at the station?'
        : 'Good. Tell me a little more.',
    }
    setConversations((currentConversations) =>
      currentConversations.map((candidate) =>
        candidate.conversationId === current
          ? {
              ...candidate,
              turns: [...candidate.turns, { role: 'learner', text: learnerText }, reply],
            }
          : candidate,
      ),
    )
    setDraft('')
    window.requestAnimationFrame(() =>
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }),
    )
    if (voice) speakJapanese(reply.text)
  }

  const recordSpeech = () => {
    if (recording) {
      recognitionRef.current?.stop()
      return
    }
    const Recognition =
      (
        window as typeof window & {
          SpeechRecognition?: SpeechRecognitionConstructor
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
      ).SpeechRecognition ??
      (
        window as typeof window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor
        }
      ).webkitSpeechRecognition
    if (!Recognition) {
      setSpeechStatus('Speech recognition is not available in this browser.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'ja-JP'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onstart = () => {
      setRecording(true)
      setSpeechStatus('Listening…')
    }
    recognition.onresult = (event) => {
      const text = Array.from(
        { length: event.results.length },
        (_, index) => event.results[index][0]?.transcript ?? '',
      ).join('')
      setDraft(text)
      setSpeechStatus('Speech added to your message.')
    }
    recognition.onerror = () => setSpeechStatus('I could not hear that. You can try again.')
    recognition.onend = () => {
      setRecording(false)
      recognitionRef.current = null
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <FuriganaProvider mode={furigana}>
      <section className="k-language-tutor" aria-label="Language tutor">
        <header className="k-language-tutor__head">
          <div>
            <p className="k-meta">Conversation practice</p>
            <h2 className="k-h2">{conversation?.title ?? 'New conversation'}</h2>
            <p className="k-meta">
              {useTodayTopic
                ? `Inherited from Today’s lesson · ${PLAN.theme}`
                : 'Open conversation'}
            </p>
          </div>
          <div className="k-language-tutor__tools">
            <FuriganaToggle mode={furigana} onChange={setFurigana} />
            <button
              type="button"
              className="k-btn k-btn--secondary k-press"
              aria-pressed={translations}
              onClick={() => setTranslations((currentValue) => !currentValue)}
            >
              {translations ? 'Translations on' : 'Translations off'}
            </button>
            <button
              type="button"
              className="k-btn k-btn--secondary k-press"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((currentValue) => !currentValue)}
            >
              Settings
            </button>
          </div>

          {settingsOpen ? (
            <div className="k-tutor-settings" role="dialog" aria-label="Tutor settings">
              <div className="k-dialog__head">
                <h3 className="k-h3">Conversation settings</h3>
                <button
                  type="button"
                  className="k-icon-close k-press"
                  onClick={() => setSettingsOpen(false)}
                >
                  <span aria-hidden="true">×</span>
                  <span className="k-sr">Close settings</span>
                </button>
              </div>

              <div className="k-setting-row">
                <span className="k-field__label">Today’s topic</span>
                <button
                  type="button"
                  className="k-btn k-btn--secondary k-press"
                  aria-pressed={useTodayTopic}
                  onClick={() => setUseTodayTopic((currentValue) => !currentValue)}
                >
                  {useTodayTopic ? `On · ${PLAN.theme}` : 'Off'}
                </button>
              </div>

              <div className="k-setting-row">
                <span className="k-field__label">Scenario</span>
                <select
                  className="k-input"
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value as Scenario)}
                >
                  {SCENARIOS.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="k-setting-row">
                <span className="k-field__label">Tutor voice</span>
                <button
                  type="button"
                  className="k-btn k-btn--secondary k-press"
                  aria-pressed={voice}
                  onClick={() => setVoice((currentValue) => !currentValue)}
                >
                  {voice ? 'Replies spoken' : 'Replies silent'}
                </button>
              </div>
            </div>
          ) : null}
        </header>

        <div className="k-language-tutor__body">
          <aside className="k-conversation-rail" aria-label="Conversations">
            <button
              type="button"
              className="k-btn k-btn--primary k-press"
              onClick={createConversation}
            >
              + New conversation
            </button>
            <ul className="k-chat__list">
              {conversations.map((candidate) => (
                <li key={candidate.conversationId}>
                  <button
                    type="button"
                    className="k-btn k-btn--quiet k-press"
                    aria-pressed={current === candidate.conversationId}
                    data-current={current === candidate.conversationId ? 'true' : undefined}
                    onClick={() => {
                      setCurrent(candidate.conversationId)
                      setAnalysis(false)
                    }}
                  >
                    {candidate.title}
                    <small className="k-meta">{candidate.updatedAt}</small>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="k-language-tutor__conversation">
            <div
              className="k-chat__log"
              ref={logRef}
              tabIndex={0}
              aria-live="polite"
              aria-label="Conversation"
            >
              {conversation?.turns.length ? (
                conversation.turns.map((turn, index) => (
                  <div
                    key={index}
                    className="k-bubble"
                    data-role={turn.role === 'learner' ? 'learner' : 'sage'}
                  >
                    <p className="k-bubble__name">{turn.role === 'learner' ? 'You' : 'Tutor'}</p>
                    <p className="k-ja" lang="ja">
                      {turn.ruby ? <Ruby segments={turn.ruby} /> : turn.text}
                    </p>
                    {translations && turn.translation ? (
                      <p className="k-body-sm k-bubble__translation">{turn.translation}</p>
                    ) : null}
                    {turn.role === 'tutor' ? (
                      <button
                        type="button"
                        className="k-bubble__audio k-press"
                        onClick={() => speakJapanese(turn.text)}
                      >
                        <span aria-hidden="true">▶</span>
                        <span className="k-sr">Play this sentence</span>
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="k-chat-empty">
                  <p className="k-ja" lang="ja">
                    何について話しましょうか。
                  </p>
                  <p>What would you like to talk about?</p>
                </div>
              )}
            </div>

            <form
              className="k-compose k-tutor-compose"
              onSubmit={(event) => {
                event.preventDefault()
                send()
              }}
            >
              <label className="k-tutor-compose__field">
                <span className="k-sr">Your message</span>
                <textarea
                  className="k-textarea k-ja"
                  rows={1}
                  lang="ja"
                  value={draft}
                  placeholder="Write in Japanese, English, or rōmaji…"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      send()
                    }
                  }}
                />
              </label>
              {draft.trim() ? (
                <button
                  type="submit"
                  className="k-tutor-compose__control k-tutor-compose__send k-press"
                  aria-label="Send message"
                >
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="k-tutor-compose__control k-tutor-compose__voice k-press"
                  aria-label={recording ? 'Stop voice input' : 'Start voice input'}
                  aria-pressed={recording}
                  onClick={recordSpeech}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5Zm-3 6a6 6 0 0 0 12 0M12 17v4M9 21h6" />
                  </svg>
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
                  </svg>
                </button>
              )}
            </form>

            <button
              type="button"
              className="k-btn k-btn--quiet k-press k-tutor-review"
              aria-pressed={analysis}
              onClick={() => setAnalysis((currentValue) => !currentValue)}
            >
              {analysis ? 'Hide conversation review' : 'Review conversation'}
            </button>

            {speechStatus ? (
              <p className="k-meta" aria-live="polite">
                {speechStatus}
              </p>
            ) : null}
          </div>
        </div>

        {analysis ? (
          <section className="k-tutor-analysis" aria-label="Conversation review">
            <h3 className="k-h3">Conversation review</h3>
            <p>{ANALYSIS.summary}</p>
            <ul className="k-fig k-fig--mistakes">
              {ANALYSIS.patterns.map((pattern) => (
                <li key={pattern.pattern} className="k-mistake">
                  <p className="k-mistake__row">
                    <span className="k-mistake__label">You wrote</span>
                    <span lang="ja">{pattern.original}</span>
                  </p>
                  <p className="k-mistake__row">
                    <span className="k-mistake__label">Better</span>
                    <span lang="ja">{pattern.corrected}</span>
                  </p>
                  <p className="k-mistake__why">{pattern.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </FuriganaProvider>
  )
}

interface SpeechRecognitionResultLike {
  readonly length: number
  readonly [index: number]: { transcript: string }
}

interface SpeechRecognitionEventLike {
  readonly results: {
    readonly length: number
    readonly [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

function speakJapanese(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  window.speechSynthesis.speak(utterance)
}
