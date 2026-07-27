/* Romaji → kana conversion — design_system.md §4.3.
 *
 * The learner types Latin letters and the field converts live. No OS-level
 * IME, so a beginner is not blocked before their first card. Kana only,
 * never kanji — which is why §4.3 accepts kana as the answer.
 *
 * The cases below are the ones that make a naïve mapping feel broken:
 * digraphs, small kana, gemination, and ん disambiguation. */

const DIGRAPHS: Record<string, string> = {
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ',
  sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
  tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ',
  jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',
  zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  tsu: 'つ', chi: 'ち', shi: 'し',
}

const PAIRS: Record<string, string> = {
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  sa: 'さ', si: 'し', su: 'す', se: 'せ', so: 'そ',
  ta: 'た', ti: 'ち', tu: 'つ', te: 'て', to: 'と',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  wa: 'わ', wo: 'を',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
}

const VOWELS: Record<string, string> = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
}

const HIRA_TO_KATA = (s: string) =>
  s.replace(/[ぁ-ゖ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60),
  )

export interface Converted {
  /** Resolved kana. */
  kana: string
  /** The Latin tail still being composed — shown to the learner (§4.3). */
  buffer: string
}

/**
 * Converts as much of `input` as resolves, leaving the unresolved tail in
 * `buffer` so the learner can see what they are producing.
 */
export function toKana(input: string, katakana = false): Converted {
  let rest = input.toLowerCase()
  let out = ''
  // Katakana lengthens a repeated vowel with ー rather than repeating it.
  let lastVowel = ''

  while (rest.length > 0) {
    // Pass through anything that is already kana or punctuation.
    const head = rest[0]
    if (!/[a-z]/.test(head)) {
      out += head
      lastVowel = ''
      rest = rest.slice(1)
      continue
    }

    if (katakana && VOWELS[head] && head === lastVowel) {
      out += 'ー'
      rest = rest.slice(1)
      continue
    }

    // ん — before a consonant, at the end of a word, or written n'.
    if (head === 'n') {
      if (rest.startsWith("n'")) {
        out += 'ん'
        lastVowel = ''
        rest = rest.slice(2)
        continue
      }
      const after = rest[1]
      // "n" followed by any consonant — including a second n, where the
      // second one starts the next syllable: konnichiwa → こんにちわ.
      if (after && !/[aiueoy]/.test(after)) {
        out += 'ん'
        lastVowel = ''
        rest = rest.slice(1)
        continue
      }
    }

    // Gemination: a doubled consonant becomes っ plus the rest.
    if (
      rest.length >= 2 &&
      rest[0] === rest[1] &&
      /[bcdfghjkmpqrstvwxyz]/.test(rest[0])
    ) {
      out += 'っ'
      rest = rest.slice(1)
      continue
    }

    const three = rest.slice(0, 3)
    if (DIGRAPHS[three]) {
      out += DIGRAPHS[three]
      lastVowel = three[2]
      rest = rest.slice(3)
      continue
    }

    const two = rest.slice(0, 2)
    if (PAIRS[two]) {
      out += PAIRS[two]
      lastVowel = two[1]
      rest = rest.slice(2)
      continue
    }

    if (VOWELS[head]) {
      out += VOWELS[head]
      lastVowel = head
      rest = rest.slice(1)
      continue
    }

    // Unresolved consonant — still composing. Everything from here is buffer.
    break
  }

  return {
    kana: katakana ? HIRA_TO_KATA(out) : out,
    buffer: rest,
  }
}

/** A single ん left dangling at the end of an answer is a complete ん. */
export function finalise(c: Converted, katakana = false): string {
  if (c.buffer === 'n') return c.kana + (katakana ? 'ン' : 'ん')
  return c.kana
}
