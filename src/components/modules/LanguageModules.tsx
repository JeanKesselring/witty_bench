import { useMemo, useState, type ReactNode } from 'react'

import { ModuleFrame, ModuleStatus } from './ModuleFrame'

type ChoiceDrillProps = {
  answer: string
  choices: string[]
  code: string
  instruction: string
  kind: string
  prompt: ReactNode
  title: string
}

function ChoiceDrill({
  answer,
  choices,
  code,
  instruction,
  kind,
  prompt,
  title,
}: ChoiceDrillProps) {
  const [choice, setChoice] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = choice === answer

  return (
    <ModuleFrame
      code={code}
      kind={kind}
      title={title}
      footer={
        checked ? (
          <ModuleStatus tone={correct ? 'right' : 'wrong'}>
            {correct ? 'Correct' : `Answer · ${answer}`}
          </ModuleStatus>
        ) : (
          <span>{instruction}</span>
        )
      }
    >
      <div className="language-drill">
        <div className="language-drill__prompt">{prompt}</div>
        <div className="language-drill__choices">
          {choices.map((item) => (
            <button
              data-selected={choice === item}
              disabled={checked}
              key={item}
              lang={/[ぁ-んァ-ヶ一-鿿]/.test(item) ? 'ja' : 'en'}
              onClick={() => setChoice(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="language-drill__check"
          disabled={choice === null}
          onClick={() => setChecked((value) => !value)}
          type="button"
        >
          {checked ? 'Try again' : 'Check'}
        </button>
      </div>
    </ModuleFrame>
  )
}

type TextDrillProps = {
  answers: string[]
  code: string
  instruction: string
  kind: string
  placeholder?: string
  prompt: ReactNode
  title: string
}

function TextDrill({
  answers,
  code,
  instruction,
  kind,
  placeholder = 'Type your answer…',
  prompt,
  title,
}: TextDrillProps) {
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(false)
  const normalize = (value: string) => value.trim().toLowerCase().replaceAll(' ', '')
  const correct = answers.some((answer) => normalize(answer) === normalize(text))

  return (
    <ModuleFrame
      code={code}
      kind={kind}
      title={title}
      footer={
        checked ? (
          <ModuleStatus tone={correct ? 'right' : 'wrong'}>
            {correct ? 'Correct' : `Answer · ${answers[0]}`}
          </ModuleStatus>
        ) : (
          <span>{instruction}</span>
        )
      }
    >
      <div className="language-drill">
        <div className="language-drill__prompt">{prompt}</div>
        <input
          disabled={checked}
          lang="ja"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && text.trim()) setChecked(true)
          }}
          placeholder={placeholder}
          value={text}
        />
        <button
          className="language-drill__check"
          disabled={!text.trim()}
          onClick={() => setChecked((value) => !value)}
          type="button"
        >
          {checked ? 'Try again' : 'Check'}
        </button>
      </div>
    </ModuleFrame>
  )
}

function speakJapanese(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.82
  window.speechSynthesis.speak(utterance)
}

export function LanguageFlashcardModule() {
  const [revealed, setRevealed] = useState(false)
  const [rating, setRating] = useState<string | null>(null)

  return (
    <ModuleFrame
      code="FC"
      kind="Self-rated recall"
      title="Flashcard"
      footer={<span>{rating ? `Rated · ${rating}` : 'Space or tap to reveal'}</span>}
    >
      <button
        aria-pressed={revealed}
        className="language-flashcard"
        onClick={() => setRevealed((value) => !value)}
        type="button"
      >
        <span>{revealed ? 'Answer' : 'Prompt'}</span>
        <strong lang="ja">{revealed ? 'ねこ · 猫' : 'cat'}</strong>
        <p>{revealed ? 'A small domesticated feline.' : 'Produce the Japanese word.'}</p>
      </button>
      {revealed && (
        <div className="language-ratings">
          {['Again', 'Hard', 'Good', 'Easy'].map((item) => (
            <button key={item} onClick={() => setRating(item)} type="button">{item}</button>
          ))}
        </div>
      )}
    </ModuleFrame>
  )
}

export function KanaRecognitionModule() {
  return (
    <ChoiceDrill
      answer="ka"
      choices={['ka', 'ki', 'sa', 'ta']}
      code="KR"
      instruction="Symbol → sound"
      kind="Kana"
      prompt={<strong className="language-glyph" lang="ja">か</strong>}
      title="Kana recognition"
    />
  )
}

export function KanaProductionModule() {
  return (
    <ChoiceDrill
      answer="き"
      choices={['さ', 'き', 'ち', 'に']}
      code="KP"
      instruction="Sound → symbol"
      kind="Kana"
      prompt={<><span className="language-kicker">Sound</span><strong>ki</strong></>}
      title="Kana production"
    />
  )
}

export function DiscriminationModule() {
  return (
    <ChoiceDrill
      answer="シ"
      choices={['ツ', 'シ']}
      code="DS"
      instruction="Choose the glyph read “shi”"
      kind="Confusables"
      prompt={<><span className="language-kicker">Which one is</span><strong>shi?</strong></>}
      title="Discrimination"
    />
  )
}

export function KanjiMeaningModule() {
  return (
    <ChoiceDrill
      answer="water"
      choices={['fire', 'water', 'tree', 'gold']}
      code="KM"
      instruction="Kanji → meaning"
      kind="Kanji"
      prompt={<strong className="language-glyph" lang="ja">水</strong>}
      title="Kanji meaning"
    />
  )
}

export function KanjiReadingModule() {
  const readings = ['さん', 'やま', 'せん', 'かわ']
  const answers = ['さん', 'やま']
  const [selected, setSelected] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const correct =
    selected.length === answers.length && answers.every((answer) => selected.includes(answer))

  return (
    <ModuleFrame
      code="KJ"
      kind="Kanji"
      title="Kanji readings"
      footer={
        checked
          ? <ModuleStatus tone={correct ? 'right' : 'wrong'}>{correct ? 'Both readings found' : 'On · さん / Kun · やま'}</ModuleStatus>
          : <span>Select both on and kun readings</span>
      }
    >
      <div className="language-drill">
        <div className="language-drill__prompt">
          <strong className="language-glyph" lang="ja">山</strong>
        </div>
        <div className="language-drill__choices">
          {readings.map((reading) => (
            <button
              data-selected={selected.includes(reading)}
              disabled={checked}
              key={reading}
              onClick={() =>
                setSelected((current) =>
                  current.includes(reading)
                    ? current.filter((item) => item !== reading)
                    : [...current, reading],
                )
              }
              type="button"
            >
              {reading}
            </button>
          ))}
        </div>
        <button
          className="language-drill__check"
          disabled={selected.length === 0}
          onClick={() => setChecked((value) => !value)}
          type="button"
        >
          {checked ? 'Try again' : 'Check'}
        </button>
      </div>
    </ModuleFrame>
  )
}

export function VocabRecognitionModule() {
  return (
    <ChoiceDrill
      answer="library"
      choices={['station', 'library', 'hospital', 'school']}
      code="VR"
      instruction="Word → meaning"
      kind="Vocabulary"
      prompt={<><strong lang="ja">図書館</strong><small lang="ja">としょかん</small></>}
      title="Vocab recognition"
    />
  )
}

export function VocabProductionModule() {
  return (
    <TextDrill
      answers={['ねこ', 'neko']}
      code="VP"
      instruction="Meaning → word"
      kind="Vocabulary"
      placeholder="ひらがな or rōmaji…"
      prompt={<><span className="language-kicker">Produce in Japanese</span><strong>cat</strong></>}
      title="Vocab production"
    />
  )
}

export function VocabGuessModule() {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [checked, setChecked] = useState(false)
  const correct = ['ねこ', 'neko', '猫'].includes(text.trim().toLowerCase())

  return (
    <ModuleFrame
      code="VG"
      kind="Speaking"
      title="Vocab guesser"
      footer={
        checked
          ? <ModuleStatus tone={correct ? 'right' : 'wrong'}>{correct ? 'Pronunciation accepted' : 'Answer · ねこ'}</ModuleStatus>
          : <span>Meaning → spoken word</span>
      }
    >
      <div className="language-drill">
        <div className="language-drill__prompt">
          <span className="language-kicker">Say in Japanese</span>
          <strong>cat</strong>
        </div>
        <button
          className="speech-button"
          data-listening={listening}
          onClick={() => setListening((value) => !value)}
          type="button"
        >
          <i aria-hidden="true" />
          {listening ? 'Listening…' : 'Record answer'}
        </button>
        <input
          aria-label="Speech transcript fallback"
          disabled={checked}
          onChange={(event) => setText(event.target.value)}
          placeholder="or type transcript…"
          value={text}
        />
        <button
          className="language-drill__check"
          disabled={!text.trim()}
          onClick={() => setChecked((value) => !value)}
          type="button"
        >
          {checked ? 'Try again' : 'Check'}
        </button>
      </div>
    </ModuleFrame>
  )
}

export function ConjugationModule() {
  return (
    <TextDrill
      answers={['たべました', '食べました', 'tabemashita']}
      code="CJ"
      instruction="Produce the polite past form"
      kind="Morphology"
      placeholder="ひらがな or rōmaji…"
      prompt={<><strong lang="ja">食べる</strong><small lang="ja">たべる · to eat</small></>}
      title="Conjugation drill"
    />
  )
}

export function ParticleClozeModule() {
  return (
    <ChoiceDrill
      answer="を"
      choices={['は', 'が', 'を', 'に']}
      code="PC"
      instruction="Choose the missing particle"
      kind="Grammar"
      prompt={<><strong lang="ja">本 ___ 読みます。</strong><small>I read a book.</small></>}
      title="Particle play"
    />
  )
}

export function SentenceScrambleModule() {
  const source = useMemo(
    () => [
      { id: 1, text: '毎朝' },
      { id: 2, text: 'コーヒーを' },
      { id: 3, text: '飲みます' },
    ],
    [],
  )
  const [order, setOrder] = useState<typeof source>([])
  const remaining = source.filter((item) => !order.includes(item))
  const [checked, setChecked] = useState(false)
  const correct = order.map((item) => item.id).join(',') === '1,2,3'

  return (
    <ModuleFrame
      code="SS"
      kind="Syntax"
      title="Sentence scramble"
      footer={
        checked
          ? <ModuleStatus tone={correct ? 'right' : 'wrong'}>{correct ? 'Natural order' : '毎朝 コーヒーを 飲みます'}</ModuleStatus>
          : <span>Rebuild the sentence</span>
      }
    >
      <div className="scramble-module">
        <div className="scramble-module__answer">
          {order.length === 0 && <span>Tap chunks in order</span>}
          {order.map((item) => (
            <button
              disabled={checked}
              key={item.id}
              onClick={() => setOrder((current) => current.filter((entry) => entry !== item))}
              type="button"
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="scramble-module__pool">
          {remaining.map((item) => (
            <button
              disabled={checked}
              key={item.id}
              onClick={() => setOrder((current) => [...current, item])}
              type="button"
            >
              {item.text}
            </button>
          ))}
        </div>
        <button
          className="language-drill__check"
          disabled={remaining.length > 0}
          onClick={() => setChecked((value) => !value)}
          type="button"
        >
          {checked ? 'Try again' : 'Check'}
        </button>
      </div>
    </ModuleFrame>
  )
}

export function GrammarRecognitionModule() {
  return (
    <ChoiceDrill
      answer="ongoing action"
      choices={['past experience', 'ongoing action', 'strong obligation', 'comparison']}
      code="GR"
      instruction="Grammar → meaning"
      kind="Grammar"
      prompt={<><strong lang="ja">〜ている</strong><small lang="ja">今、勉強しています。</small></>}
      title="Grammar recognition"
    />
  )
}

export function GrammarProductionModule() {
  return (
    <ChoiceDrill
      answer="〜なければならない"
      choices={['〜てもいい', '〜たことがある', '〜なければならない', '〜かもしれない']}
      code="GP"
      instruction="Meaning → grammar"
      kind="Grammar"
      prompt={<><span className="language-kicker">Express</span><strong>must / have to</strong></>}
      title="Grammar production"
    />
  )
}

export function TranscriptionModule() {
  const [played, setPlayed] = useState(false)

  return (
    <div className="transcription-module">
      <TextDrill
        answers={['今日はいい天気です', 'きょうはいいてんきです']}
        code="TR"
        instruction="Audio → text"
        kind="Listening"
        placeholder="聞こえた文を書く…"
        prompt={
          <button
            className="audio-prompt"
            onClick={() => {
              setPlayed(true)
              speakJapanese('今日はいい天気です')
            }}
            type="button"
          >
            <i aria-hidden="true" />
            {played ? 'Play again' : 'Play sentence'}
          </button>
        }
        title="Transcription test"
      />
    </div>
  )
}

