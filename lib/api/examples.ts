/* One worked example per module type, for the /modules harness.
 *
 * These are not decoration. A type with no example cannot be looked at, and
 * looking is the only way to find out whether a card works — an earlier pass
 * verified this whole layer by grepping rendered markup and shipped a
 * timeline whose spine had detached, a map crushed to 512px and a panel at
 * 30% alpha that made every card unreadable. None of that is visible in a
 * DOM assertion and all of it is visible in a screenshot.
 *
 * So each example is written to be AWKWARD rather than flattering: a long
 * German compound where German is the binding layout constraint, a prompt
 * long enough to test the prompt band, prose answers that need more than one
 * line, a gallery with three images, a diagram with a cycle. A card that
 * survives these survives the generator.
 */

import type { ModuleItem } from './types'

const jaExamples = [
  {
    ja: [
      { text: '毎日', reading: 'まいにち' },
      { text: '、' },
      { text: '図書館', reading: 'としょかん' },
      { text: 'で' },
      { text: '勉強', reading: 'べんきょう' },
      { text: 'します。' },
    ],
    en: 'I study at the library every day.',
  },
  {
    ja: [
      { text: 'この' },
      { text: '図書館', reading: 'としょかん' },
      { text: 'は' },
      { text: '静', reading: 'しず' },
      { text: 'かです。' },
    ],
    en: 'This library is quiet.',
  },
]

export const EXAMPLE_MODULES: ModuleItem[] = [
  /* ── Graded, academic ─────────────────────────────────────────── */
  {
    id: 'x-flashcard-set',
    topicId: 't-6',
    topicTitle: 'Distributions',
    moduleType: 'flashcard',
    contentType: 'flashcard',
    prompt: 'When does a binomial distribution approach a normal one?',
    answer:
      'When n is large and p is not close to 0 or 1 — the usual working rule is np ≥ 10 and n(1−p) ≥ 10.',
    cards: [
      {
        prompt: 'When does a binomial distribution approach a normal one?',
        answer:
          'When n is large and p is not close to 0 or 1 — the usual working rule is np ≥ 10 and n(1−p) ≥ 10.',
      },
      {
        prompt: 'What is the variance of a binomial distribution?',
        answer: 'np(1−p).',
      },
      {
        prompt: 'When does a binomial approach a Poisson instead?',
        answer: 'When n is large and p is small, with np held moderate. The Poisson mean is np.',
      },
      {
        prompt: 'What does the memorylessness of the geometric distribution mean?',
        answer:
          'The probability of needing k more trials does not depend on how many have already failed.',
      },
    ],
  },
  {
    id: 'x-quiz',
    topicId: 't-4',
    topicTitle: 'Independence',
    moduleType: 'quiz',
    contentType: 'quiz',
    prompt:
      'Events A and B are independent, P(A) = 0.4 and P(B) = 0.5. A third event C is the union of A and B. What is P(C)?',
    options: ['0.9', '0.7', '0.2', '0.45'],
    answer: '0.7',
    cards: [
      {
        prompt:
          'Events A and B are independent, P(A) = 0.4 and P(B) = 0.5. A third event C is the union of A and B. What is P(C)?',
        options: ['0.9', '0.7', '0.2', '0.45'],
        answer: '0.7',
        explanation: 'P(A∪B) = P(A) + P(B) − P(A)P(B) = 0.4 + 0.5 − 0.2.',
      },
      {
        prompt: 'If A and B are independent, what is P(A | B)?',
        options: ['P(A)', 'P(B)', 'P(A)P(B)', '0'],
        answer: 'P(A)',
        explanation: 'That equality IS the definition of independence.',
      },
      {
        prompt:
          'Two events are mutually exclusive and both have non-zero probability. Are they independent?',
        options: ['Never', 'Always', 'Only if equally likely', 'Only if P(A) = 0.5'],
        answer: 'Never',
        explanation: 'If A occurs, B cannot — the strongest dependence there is.',
      },
    ],
  },
  {
    id: 'x-timeline-drag',
    topicId: 't-20',
    topicTitle: 'Glacial cycles',
    moduleType: 'timeline_drag_exercise',
    contentType: 'quiz',
    prompt: 'Put these glacial and interglacial stages in order, earliest first.',
    tokens: [
      'Holocene interglacial',
      'Last Glacial Maximum',
      'Eemian interglacial',
      'Riss glaciation',
    ],
    answer: 'Riss glaciation|Eemian interglacial|Last Glacial Maximum|Holocene interglacial',
  },
  {
    id: 'x-map-click',
    topicId: 't-21',
    topicTitle: 'Alpine orogeny',
    moduleType: 'map_click_quiz',
    contentType: 'quiz',
    prompt: 'Where is the Matterhorn?',
    mapTargets: [
      { label: 'Matterhorn', lat: 45.9763, lng: 7.6586 },
      { label: 'Mont Blanc', lat: 45.8326, lng: 6.8652 },
      { label: 'Großglockner', lat: 47.0745, lng: 12.6939 },
      { label: 'Triglav', lat: 46.3786, lng: 13.8367 },
    ],
    answer: 'Matterhorn',
  },
  {
    id: 'x-lattice-map-click',
    topicId: 't-21',
    topicTitle: 'Alpine orogeny',
    moduleType: 'lattice_map_click_quiz',
    contentType: 'quiz',
    prompt: 'Where is Mont Blanc?',
    mapTargets: [
      { label: 'Matterhorn', lat: 45.9763, lng: 7.6586 },
      { label: 'Mont Blanc', lat: 45.8326, lng: 6.8652 },
      { label: 'Großglockner', lat: 47.0745, lng: 12.6939 },
      { label: 'Triglav', lat: 46.3786, lng: 13.8367 },
    ],
    answer: 'Mont Blanc',
  },

  /* ── Graded, language ─────────────────────────────────────────── */
  {
    id: 'x-language-flashcard',
    topicId: 't-13',
    topicTitle: 'N5 vocabulary',
    moduleType: 'flashcard',
    contentType: 'flashcard',
    prompt: '図書館',
    promptRuby: [{ text: '図書館', reading: 'としょかん' }],
    lang: 'ja',
    answer: 'library',
    examples: jaExamples,
  },
  {
    id: 'x-kana-recognition',
    topicId: 't-10',
    topicTitle: 'Hiragana',
    moduleType: 'quiz',
    contentType: 'quiz',
    prompt: 'ふ',
    lang: 'ja',
    options: ['fu', 'ha', 'he', 'ho'],
    answer: 'fu',
  },
  {
    id: 'x-kanji-meaning',
    topicId: 't-14',
    topicTitle: 'Kanji: nature',
    moduleType: 'kanji_meaning',
    contentType: 'quiz',
    prompt: '森',
    promptRuby: [{ text: '森', reading: 'もり' }],
    lang: 'ja',
    options: ['forest', 'mountain', 'river', 'field'],
    answer: 'forest',
  },
  {
    id: 'x-kanji-reading',
    topicId: 't-14',
    topicTitle: 'Kanji: nature',
    moduleType: 'kanji_reading',
    contentType: 'quiz',
    prompt: '山 — give the kun’yomi reading.',
    lang: 'ja',
    answer: 'やま',
  },
  {
    id: 'x-vocab-recognition',
    topicId: 't-13',
    topicTitle: 'N5 vocabulary',
    moduleType: 'vocab_recognition',
    contentType: 'quiz',
    prompt: '新しい',
    promptRuby: [{ text: '新', reading: 'あたら' }, { text: 'しい' }],
    lang: 'ja',
    options: ['new', 'expensive', 'quiet', 'difficult'],
    answer: 'new',
    examples: jaExamples.slice(0, 1),
  },
  {
    id: 'x-vocab-guess',
    topicId: 't-13',
    topicTitle: 'N5 vocabulary',
    moduleType: 'vocab_guess',
    contentType: 'audio',
    prompt: 'Say the Japanese for “library”.',
    lang: 'ja',
    answer: 'としょかん',
    examples: jaExamples.slice(0, 1),
  },
  {
    id: 'x-conjugation',
    topicId: 't-15',
    topicTitle: 'て-form',
    moduleType: 'conjugation',
    contentType: 'quiz',
    prompt: '行く → て-form',
    promptRuby: [{ text: '行', reading: 'い' }, { text: 'く → て-form' }],
    lang: 'ja',
    answer: 'いって',
  },
  {
    id: 'x-grammar-recognition',
    topicId: 't-16',
    topicTitle: '〜たことがある',
    moduleType: 'grammar_recognition',
    contentType: 'quiz',
    prompt: 'What does 〜たことがある express?',
    lang: 'ja',
    options: [
      'Experience of having done something',
      'An action in progress',
      'An obligation',
      'A polite request',
    ],
    answer: 'Experience of having done something',
  },
  {
    id: 'x-grammar-production',
    topicId: 't-16',
    topicTitle: '〜たことがある',
    moduleType: 'grammar_production',
    contentType: 'quiz',
    // Deliberately a prose answer: this is the type that got a one-line
    // input last time and had the start of the answer scrolled out of view.
    prompt:
      'Explain, in your own words, when you would use 〜たことがある rather than the plain past た, and give the difference in meaning.',
    answer:
      'Use 〜たことがある for an experience you have had at some point, not for a specific past event. 日本に行ったことがある means “I have been to Japan”; 日本に行った means “I went to Japan”.',
  },
  {
    id: 'x-transcription',
    topicId: 't-17',
    topicTitle: 'Listening: daily routine',
    moduleType: 'transcription',
    contentType: 'audio',
    prompt: 'Write down the sentence you hear.',
    lang: 'ja',
    audioSrc: '/media/sentence-ja.wav',
    transcript: [
      { text: '毎日', reading: 'まいにち' },
      { text: '、' },
      { text: '学校', reading: 'がっこう' },
      { text: 'に' },
      { text: '行', reading: 'い' },
      { text: 'きます。' },
    ],
    answer: 'まいにちがっこうにいきます',
  },
  {
    id: 'x-kanji-writing',
    topicId: 't-14',
    topicTitle: 'Kanji: nature',
    moduleType: 'kanji_writing',
    contentType: 'quiz',
    prompt: 'Write the kanji for “river”.',
    lang: 'ja',
    answer: '川',
  },

  /* ── Ungraded learning cards ──────────────────────────────────── */
  {
    id: 'x-text',
    topicId: 't-3',
    topicTitle: 'Conditional probability',
    moduleType: 'text',
    contentType: 'text',
    prompt: 'Conditional probability',
    subtitle: 'Why the denominator changes',
    body:
      'Conditioning on an event does one thing: it **shrinks the sample space**. Everything ' +
      'outside the condition stops existing, and the probabilities that remain are rescaled so ' +
      'they still sum to one.\n\n' +
      'That is the whole of the definition:\n\n' +
      '> P(A | B) = P(A ∩ B) / P(B), for P(B) > 0\n\n' +
      'The numerator asks how much of A survives inside B. The denominator asks how big B was ' +
      'to begin with. Most mistakes with conditional probability are a numerator taken from the ' +
      'original space and a denominator taken from the conditioned one.\n\n' +
      '### Where it goes wrong\n\n' +
      '1. Reading P(A | B) as P(B | A). These are equal only when P(A) = P(B).\n' +
      '2. Forgetting that conditioning can *raise* a probability as easily as lower it.\n' +
      '3. Conditioning on an event of probability zero, which is undefined rather than small.',
    answer: '',
    grounding: 'material',
    sources: [{ label: 'Lecture 4 notes', href: 'https://example.org/lecture-4' }],
  },
  {
    id: 'x-summary',
    topicId: 't-3',
    topicTitle: 'Conditional probability',
    moduleType: 'summary',
    contentType: 'summary',
    prompt: 'What you should take away',
    body:
      'Conditioning rescales. Independence is the special case where conditioning changes ' +
      'nothing. Bayes’ theorem is what you use when you have the conditional you did not want ' +
      'and need the one you did.',
    answer: '',
    grounding: 'material',
  },
  {
    id: 'x-key-value',
    topicId: 't-22',
    topicTitle: 'Basalt',
    moduleType: 'key_value_pairs',
    contentType: 'text',
    prompt: 'Basalt at a glance',
    figure: {
      kind: 'pairs',
      rows: [
        { key: 'Rock class', value: 'Igneous, extrusive' },
        { key: 'Silica content', value: '45–52 %' },
        { key: 'Typical colour', value: 'Dark grey to black' },
        { key: 'Grain size', value: 'Fine (< 1 mm)' },
        { key: 'Main minerals', value: 'Plagioclase, pyroxene, olivine' },
        { key: 'Density', value: '2.8–3.0 g/cm³' },
        { key: 'Eruption temperature', value: '1100–1250 °C' },
        { key: 'Weathering product', value: 'Clay minerals, iron oxides' },
      ],
      note: 'Basalt covers most of the ocean floor, which makes it the most common rock on the planet’s surface.',
    },
    answer: '',
    grounding: 'material',
  },
  {
    id: 'x-timeline',
    topicId: 't-23',
    topicTitle: 'The Alpine orogeny',
    moduleType: 'timeline',
    contentType: 'text',
    prompt: 'How the Alps were built',
    figure: {
      kind: 'timeline',
      events: [
        { when: '~135 Ma', what: 'The Penninic ocean begins to close as Africa moves north.' },
        { when: '~65 Ma', what: 'Subduction consumes the oceanic crust; the first nappes stack.' },
        { when: '~35 Ma', what: 'Continental collision proper — Adria meets Europe.' },
        { when: '~20 Ma', what: 'The Central Alps are uplifted and the foreland basin fills.' },
        { when: '~5 Ma', what: 'Erosion outpaces uplift in places; the modern relief emerges.' },
        { when: '~20 ka', what: 'Glaciers of the Last Glacial Maximum carve the present valleys.' },
      ],
    },
    answer: '',
  },
  {
    id: 'x-common-mistakes',
    topicId: 't-4',
    topicTitle: 'Independence',
    moduleType: 'common_mistakes',
    contentType: 'text',
    prompt: 'Where independence goes wrong',
    figure: {
      kind: 'mistakes',
      items: [
        {
          wrong: 'Mutually exclusive events are independent.',
          right: 'Mutually exclusive events with non-zero probability are never independent.',
          why: 'If A happens, B cannot — that is the strongest possible dependence.',
        },
        {
          wrong: 'Pairwise independence means the whole set is independent.',
          right: 'Joint independence is a stronger condition and has to be checked separately.',
        },
        {
          wrong: 'Independent means unrelated in the everyday sense.',
          right: 'It means the conditional equals the unconditional probability. Nothing more.',
        },
      ],
    },
    answer: '',
  },
  {
    id: 'x-comparison',
    topicId: 't-24',
    topicTitle: 'Weathering und Erosion',
    moduleType: 'comparison_vs_similar',
    contentType: 'text',
    // German on purpose: compounds are the binding layout constraint (§4).
    prompt: 'Verwitterung und Abtragung — leicht zu verwechseln',
    figure: {
      kind: 'comparison',
      left: {
        title: 'Verwitterung',
        points: [
          'Zersetzt Gestein an Ort und Stelle',
          'Physikalisch, chemisch oder biologisch',
          'Kein Materialtransport',
          'Frostsprengung als Schulbeispiel',
        ],
      },
      right: {
        title: 'Abtragung',
        points: [
          'Transportiert gelöstes Material fort',
          'Wasser, Wind, Eis oder Schwerkraft',
          'Setzt gelockertes Material voraus',
          'Gletschererosion als Schulbeispiel',
        ],
      },
      note: 'Verwitterung bereitet vor, Abtragung räumt ab. Wer beides verwechselt, erklärt Landschaftsformen mit dem falschen Prozess.',
    },
    answer: '',
  },
  {
    id: 'x-conversion',
    topicId: 't-25',
    topicTitle: 'Units of pressure',
    moduleType: 'conversion_calculator',
    contentType: 'text',
    prompt: 'Convert a pressure',
    figure: {
      kind: 'conversion',
      source: { name: 'Bar', symbol: 'bar' },
      groups: [
        {
          label: 'SI and metric',
          units: [
            { name: 'Pascal', symbol: 'Pa', factor: 100000 },
            { name: 'Kilopascal', symbol: 'kPa', factor: 100 },
            { name: 'Millibar', symbol: 'mbar', factor: 1000 },
          ],
        },
        {
          label: 'Other',
          units: [
            { name: 'Atmosphere', symbol: 'atm', factor: 0.986923 },
            { name: 'Millimetres of mercury', symbol: 'mmHg', factor: 750.062 },
            { name: 'Pounds per square inch', symbol: 'psi', factor: 14.5038 },
          ],
        },
      ],
    },
    answer: '',
  },
  {
    id: 'x-balance',
    topicId: 't-26',
    topicTitle: 'Photosynthesis',
    moduleType: 'input_output_balance',
    contentType: 'text',
    prompt: 'The light-dependent reactions, in and out',
    figure: {
      kind: 'balance',
      inputs: ['6 CO₂', '6 H₂O', 'Light energy (photons)'],
      outputs: ['C₆H₁₂O₆ (glucose)', '6 O₂'],
      stored: '≈ 2 870 kJ per mole of glucose',
      note: 'Only about 1–2 % of the light striking a leaf ends up as chemical energy.',
    },
    answer: '',
    grounding: 'external',
    sources: [
      { label: 'Wikipedia — Photosynthesis', href: 'https://en.wikipedia.org/wiki/Photosynthesis' },
    ],
  },
  {
    id: 'x-formula',
    topicId: 't-27',
    topicTitle: 'Bayes’ theorem',
    moduleType: 'formula_equation',
    contentType: 'text',
    prompt: 'Bayes’ theorem',
    figure: {
      kind: 'formula',
      expression: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{\\sum_{i} P(B \\mid A_i)\\,P(A_i)}',
      terms: [
        { symbol: 'P(A \\mid B)', meaning: 'Posterior — what you believe after seeing B' },
        { symbol: 'P(B \\mid A)', meaning: 'Likelihood — how well A explains B' },
        { symbol: 'P(A)', meaning: 'Prior — what you believed before' },
        { symbol: 'A_i', meaning: 'The partition of the sample space you are summing over' },
      ],
    },
    answer: '',
  },
  {
    id: 'x-diagram',
    topicId: 't-26',
    topicTitle: 'Photosynthesis',
    moduleType: 'diagram_schematic',
    contentType: 'text',
    prompt: 'The Calvin cycle',
    figure: {
      kind: 'diagram',
      layout: 'cycle',
      nodes: [
        {
          id: 'fix',
          label: 'Carbon fixation',
          shape: 'box',
          description: 'RuBisCO attaches CO₂ to RuBP, giving two molecules of 3-PGA.',
        },
        {
          id: 'red',
          label: 'Reduction',
          shape: 'box',
          description: 'ATP and NADPH convert 3-PGA into G3P.',
        },
        {
          id: 'out',
          label: 'G3P leaves',
          shape: 'oval',
          description: 'One in six G3P molecules exits to build glucose.',
        },
        {
          id: 'reg',
          label: 'Regeneration',
          shape: 'diamond',
          description: 'The remaining G3P rebuilds RuBP, using more ATP.',
        },
      ],
      edges: [
        { from: 'fix', to: 'red', label: 'ATP' },
        { from: 'red', to: 'out', style: 'dashed' },
        { from: 'red', to: 'reg' },
        { from: 'reg', to: 'fix', label: 'RuBP' },
      ],
    },
    answer: '',
  },
  {
    id: 'x-globe',
    topicId: 't-28',
    topicTitle: 'Volcanic arcs',
    moduleType: 'globe_pin',
    contentType: 'text',
    prompt: 'Where the Pacific arcs sit',
    figure: {
      kind: 'globe',
      pins: [
        {
          label: 'Mount Fuji',
          lat: 35.3606,
          lng: 138.7274,
          description: 'Stratovolcano at the junction of three plates; last erupted in 1707.',
        },
        {
          label: 'Mount St. Helens',
          lat: 46.1912,
          lng: -122.1944,
          description: 'Cascade arc; the 1980 lateral blast removed 400 m of summit.',
        },
        {
          label: 'Krakatoa',
          lat: -6.1021,
          lng: 105.423,
          description: 'Sunda arc; the 1883 eruption was heard 4 800 km away.',
        },
        {
          label: 'Mount Pinatubo',
          lat: 15.13,
          lng: 120.35,
          description: 'Luzon arc; the 1991 eruption cooled global temperatures by ~0.5 °C.',
        },
      ],
      note: 'Each of these sits above a subducting slab — the arc traces the plate boundary.',
    },
    answer: '',
  },
  {
    id: 'x-hero',
    topicId: 't-29',
    topicTitle: 'Neuron anatomy',
    moduleType: 'hero_image',
    contentType: 'text',
    prompt: 'What a neuron looks like',
    figure: {
      kind: 'gallery',
      images: [
        {
          src: '/images/neuron-anatomy.png',
          alt: 'Labelled diagram of a multipolar neuron: dendrites converge on the cell body, a myelinated axon leaves it and ends in terminals meeting another cell at a synapse.',
          caption: 'The parts of a neuron, with the synapse enlarged.',
          attribution: 'Wikimedia Commons',
          license: 'CC BY-SA 3.0',
        },
        {
          src: '/images/all-or-none.png',
          alt: 'Graph of membrane potential against time showing that stimuli below threshold produce no action potential and all stimuli above it produce an identical spike.',
          caption: 'The all-or-none law: above threshold, every spike is the same size.',
          attribution: 'Wikimedia Commons',
          license: 'CC BY-SA 3.0',
        },
        {
          src: '/images/photosynthesis.jpg',
          alt: 'Cross-section of a leaf showing light striking chloroplasts, water arriving from the roots and oxygen leaving through a stoma.',
          caption: 'For contrast: the same diagrammatic convention used for a plant cell.',
          attribution: 'Wikimedia Commons',
        },
      ],
    },
    answer: '',
    grounding: 'external',
  },
  {
    id: 'x-model',
    topicId: 't-30',
    topicTitle: 'Landform models',
    moduleType: 'model_3d',
    contentType: 'video',
    prompt: 'A glacial valley in three dimensions',
    figure: {
      kind: 'model',
      src: '/models/specimen.glb',
      poster: '/landform-model.svg',
      alt: 'A three-dimensional model of a U-shaped glacial valley, seen from the south-west, with a hanging valley on the far wall.',
      reveals:
        'Turning it shows what a photograph cannot: the valley floor is flat-bottomed rather than V-shaped, and the truncated spurs on both walls line up at the same height — the level the ice surface once stood at.',
      attribution: 'Generated model, Common Sage module factory',
    },
    answer: '',
  },
  {
    id: 'x-audio',
    topicId: 't-26',
    topicTitle: 'Photosynthesis',
    moduleType: 'audio',
    contentType: 'audio',
    prompt: 'Lecture clip: the energy balance',
    figure: {
      kind: 'media',
      media: 'audio',
      src: '/media/lecture-clip.wav',
      transcript: 'Photosynthesis converts light energy into chemical energy stored in glucose.',
    },
    answer: '',
    grounding: 'material',
  },
  {
    id: 'x-video',
    topicId: 't-29',
    topicTitle: 'Neuron anatomy',
    moduleType: 'video',
    contentType: 'video',
    prompt: 'The action potential, shown',
    figure: {
      kind: 'media',
      media: 'video',
      // No file: this example deliberately exercises the failure path, which
      // is a state the player has to be right about and one no happy-path
      // fixture would ever show.
      src: '/media/action-potential.mp4',
      poster: '/images/all-or-none.png',
      transcript:
        'The membrane depolarises as sodium channels open, overshoots, then repolarises as potassium leaves the cell. The refractory period follows.',
    },
    answer: '',
  },
  {
    id: 'x-topic-card',
    topicId: 't-26',
    topicTitle: 'Photosynthesis',
    moduleType: 'topic_card',
    contentType: 'summary',
    prompt: 'Photosynthesis',
    subtitle: 'Biological process',
    figure: {
      kind: 'composite',
      figures: [
        {
          kind: 'gallery',
          images: [
            {
              src: '/images/photosynthesis.jpg',
              alt: 'Cross-section of a leaf showing light striking chloroplasts, water arriving from the roots and oxygen leaving through a stoma.',
              attribution: 'Wikimedia Commons',
            },
          ],
        },
        {
          kind: 'stats',
          items: [
            { label: 'Energy stored', value: '2 870', unit: 'kJ/mol' },
            { label: 'Light captured', value: '1–2', unit: '%' },
            { label: 'O₂ released', value: '6', note: 'per glucose' },
          ],
        },
      ],
      panels: [
        {
          title: 'What happens',
          body: 'Light-dependent reactions in the thylakoid membrane split water and build ATP and NADPH. The Calvin cycle in the stroma spends both to fix carbon dioxide into sugar.',
        },
        {
          title: 'Why it matters',
          body: 'Almost every food chain starts here, and the oxygen in the atmosphere is a by-product of it.',
        },
        {
          title: 'Common confusion',
          body: 'Photosynthesis is not the opposite of respiration. Plants do both, at the same time, and the balance between them decides whether the plant grows.',
        },
      ],
    },
    answer: '',
    grounding: 'external',
    sources: [
      { label: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/Photosynthesis' },
      { label: 'Wikimedia Commons', href: 'https://commons.wikimedia.org' },
    ],
  },
]
