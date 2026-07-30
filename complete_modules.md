# Complete Common Sage Study Module Catalog

This is the canonical, deduplicated list of study functionality found across:

- `japanese_knowledge_graph`
- `Modules/module-factory`
- `common_sage_frontend`
- `Common_Sage_Worker`
- `common_sage_backend`
- The standalone `knowledge_graph` prototype

The catalog is organized by the best presentation format:

1. Full-page study functions
2. Learning cards for an infinite-scroll feed
3. Assessment and exercise cards

## Deduplication rules

- A module is listed once even when its generator, renderer, storage contract,
  and scheduling behavior live in different repositories.
- `quiz`, legacy `mcq`, kana recognition, and chat-generated quizzes use one
  canonical Multiple-Choice Quiz module and interaction shell.
- `flashcard`, legacy `flashcard_set`, chat flashcards, and Japanese flashcards
  use one canonical Flashcard module. A set is `cards` presentation data.
- `text`, Description/Overview, and a plain non-visual Summary are one
  Explanation module.
- `summary` is treated as a storage/presentation envelope for visual modules,
  not as a separate learning module.
- The standalone Knowledge Graph prototype and the graphs in the main
  frontends are one Knowledge Graph / Concept Explorer function.
- Japanese drills that use the same response UI share one interaction shell.
  A skill target remains metadata only where it does not change interaction.
- Kana Production is removed from the repertoire.
- Topic Card remains a composite module. Its embedded child modules are not
  counted again inside it.
- Worker generation steps and backend progress services are attached to the
  modules they support rather than listed as student modules.
- Non-functional prototype controls, admin controls, authoring tools, caches,
  generators, and infrastructure are excluded.

# Part 1 — Full-page study functions

These functions coordinate several modules, require a large workspace, or form
a complete learning flow. They are best presented alone rather than inserted as
ordinary cards in an infinite feed.

## 1. Japanese Daily Lesson

Canonical scope:

- Guided daily lesson
- Daily content selection
- Printable study sheet
- Due-review session
- Focus-concept retrieval check
- Session summary

Lesson composition:

- One mixed daily plan followed by one study run.
- Review, new material, context, and recall are selection inputs, not visible
  stages or interface copy.

Primary interactions and buttons:

- Explanation language is inherited from the learner/application settings;
  it is never chosen in Today’s Lesson.
- `Start today’s lesson`
- `Continue today’s lesson`
- `Adjust your learner profile`
- `Adjust future lessons`
- `Stage complete—continue`
- `Review up to [number]`
- Open `Explanation and sources` for a focus concept.
- `Read a targeted passage`
- `Listen in context`
- `Start retrieval check`
- `Optional practice`
- `Printable lesson notes`

Daily-plan and study-sheet controls:

- `Start or resume placement`
- `Select today’s content`
- Choose intensity:
  - Tier 1
  - Tier 2
  - Tier 3
  - Tier 4
- Adjust the number of:
  - Kana items
  - Vocabulary items
  - Kanji items
  - Grammar items
- `Add one [type] item`
- `Remove one [type] item`
- `Already know`
- `Put back`
- `Reroll`
- `Review accuracy`
- `Start over`
- `Generate summary sheet`
- `Regenerate items`
- `Use themed sheet`
- `Print / save PDF`
- `Test all selected items`
- Toggle `Prioritize in future sessions until stable`.

Study-sheet content:

- Daily theme and goal
- Grammar pattern, meaning, structure, explanation, and examples
- Connected kanji, readings, meanings, components, and useful words
- Vocabulary, reading, part of speech, pitch information, and examples
- Kana focus
- Review checks
- Intensity, duration, and test-question count

Session-runner controls:

- `Previous`
- Progress such as `3 / 10`
- `Previous card`
- `Another round`
- `Back to today`
- Open concepts listed under `What changed`.

Learning behavior:

- Combines due reviews, new focus concepts, contextual use, and retrieval.
- The plan card is centred and fourteen lattice cells wide. Selectable item
  rows are compact, one-cell-high compositions with only an optical gap.
- `Already know` immediately records knowledge evidence and becomes `Put back`
  in the same action slot. `Put back` changes the visible plan but never
  retracts that evidence. `Reroll` remains in the second slot in both states
  and replaces the item without changing the dimension count. Only the
  learning-item text is struck through; neither action button receives the
  line.
- Validated card answers update mastery and spaced-repetition scheduling.
- The lesson is persisted and resumable.
- Profile changes affect future lessons without changing the active run.

Source:

- `japanese_knowledge_graph`

## 2. Adaptive Course Study Feed

Canonical scope:

- Course and lecture entry
- Topic-scoped study
- Adaptive mixed-content queue
- Infinite vertical card feed

Entry interactions:

- `Lectures`
- `Topics`
- `Start learning` on a lecture
- `Start learning` on a topic
- View `[explored] / [total] topics explored`.
- View `Not started` or `[number]% progress` on topics.

Feed filter buttons:

- `Mixed`
- `Flashcards`
- `Quizzes`
- `Learning`

Feed interactions:

- Scroll vertically between study cards.
- View position as `[current] / [loaded]`.
- See `+` while additional items load.
- Continue scrolling while more content is prefetched.
- Use the interactions belonging to each embedded card.
- `Hard`
- `Easy`

Adaptive behavior:

- Can scope recommendations to the whole course, one lecture, or one topic.
- Prefers relevant non-mastered topics.
- Avoids recently seen items for seven days.
- Interleaves review and new material.
- Targets approximately three to ten items and about ten minutes of study.
- Records the active card's duration and latest explicit score when the learner
  leaves it.
- Skips an accidental unscored view shorter than 0.7 seconds.

Source:

- UI: `common_sage_frontend`
- Recommendation and progress logic: `common_sage_backend`

## 3. Knowledge Graph / Concept Explorer

Canonical scope:

- Course hierarchy graph
- Japanese language knowledge graph
- Searchable/filterable concept list
- Concept detail and mastery view

Course-graph interactions:

- `Knowledge graph`
- The demo's balanced spatial field is populated from live course `Topic`
  records rather than its static sample graph.
- Click a topic, or press Enter while it has keyboard focus, to select it and
  preview its summary in the inspector.
- Hover a branch topic to preview its children inside its tile. Selection and
  keyboard focus do not keep the child split open; the resting field is fully
  unsplit and begins without a forced selection.
- The hover split uses the shared settle spring: it enters slightly from above
  and reveals from its top edge downward, then reverses smoothly on leave.
- Parent titles use the full tile width and approved type-scale steps based on
  title density per tile column to stay on one line. They scale smoothly to
  78% from the lower-left during the split.
- Double-click a branch tile or use `Open topic` to descend into it.
- Use the breadcrumb buttons to ascend to any previous level.
- Use arrow keys, Home, and End to move through the field as one roving
  keyboard stop.
- Keep all topic and child-preview tiles within the product's blue palette.
- Show progress as a small circular red–yellow–green flag with an explicit
  completion percentage. The percentage carries the information; colour is a
  secondary signal and never floods the tile.
- Selected topics use only the stronger blue fill, with no additional blue
  border or glow.
- Fill a 12 × 8-cell field. Narrow viewports scroll the field horizontally.
- Atomic topics show a deliberate terminal field rather than a blank region.
- The graph accepts a decorative background component through its
  `background` slot; without one it exposes the app's global background.
- Known sample course slugs (`probability`, `japanese-n5`, `geomorphology`,
  and `thermodynamics`) resolve directly from their local topic fixtures, so
  the test graph never sends fixture identities to the live API proxy.
- The probability sample is deliberately nested through four topic levels
  (three successive descents) so branch previews, repeated descent,
  breadcrumbs, and terminal topics can be exercised during testing.

Japanese explorer view controls:

- Mastery filters:
  - `Proficient`
  - `Learning`
  - `Unseen`
- Writing-system filters:
  - `Kanji`
  - `Katakana`
  - `Hiragana`
- Vocabulary filters:
  - `Verbs`
  - `Nouns`
  - `Adjectives`
  - `Particles`
  - `Adverbs`
- `Grammar`
- JLPT filters:
  - `N5`
  - `N4`
  - `N3`
  - `N2`
  - `N1`
- Select a concept to open its detail panel.
- The first available concept opens by default.
- There is no search field, graph/list switch, examples toggle, mastery
  overlay, or instructional empty-state sentence on this Japanese surface.

Concept-detail content and interactions:

- Definition
- Concept type and pillar
- Level
- Properties
- Stroke-order display when available
- Example sentences
- Related concepts and relationship directions
- Current recall estimate
- Review and lapse counts
- Recent-history sparkline
- `Practice this now`

Deduplication note:

- The standalone `knowledge_graph` repository is an earlier static version of
  this function. It contributes the same focus/hover/sidebar interaction and is
  not listed separately.
- Its inert bookmark and `Go to course` prototype buttons are not counted as
  working functionality.

Sources:

- `common_sage_frontend`
- `japanese_knowledge_graph`
- `knowledge_graph`

## 4. Japanese Reading Lab

Generation controls:

- Genre:
  - `Conversation`
  - `Japanese history`
  - `Folk tale`
- Length:
  - `Tiny`
  - `Short`
  - `Long`
- Optional topic
- Challenge:
  - `Easier`
  - `Current`
  - `Stretch`
- Politeness:
  - `Casual`
  - `Neutral`
  - `Formal`
- Toggle `Use today’s [number] focus items`.
- `Generate`
- Import an existing text by uploading TXT, DOCX, or PDF.
- Import an existing text by pasting it directly into the dialog.
- Selected controls use the stronger frontend blue as a solid fill and border,
  with dark high-contrast text.

Reading interactions:

- `Furigana: auto`
- `Furigana: all`
- `Furigana: off`
- `Translations`
- Hover, tap, or keyboard-focus a word.
- Press Enter or Space to open a word explanation.
- Show the explanation as an eight-cell-wide overlay above the reading text;
  it never reserves space or changes the text composition.
- Press Escape or click outside to close it.
- View:
  - Surface form
  - Kana
  - Rōmaji
  - English gloss
  - Grammar point and definition

Library interactions:

- Open a previously generated text.
- Press Enter to open the selected library item.
- `Delete text`
- Reuse the same text in Listen and Karaoke.
- Library and active-text panels use the standard card colour without a local
  backdrop blur, saturation, or brightness filter. Nested reading, listening,
  and read-aloud content explicitly resets that filter so no blur sits directly
  behind the text.

Learning behavior:

- Practices reading comprehension, vocabulary, and grammar in context.
- Adaptive target items can be woven into the generated passage.
- Reading itself does not directly grade mastery.

Source:

- `japanese_knowledge_graph`

## 5. Japanese Listening Lab

Generation and library controls:

- Uses the same genre, length, topic, challenge, politeness, focus-item, Generate,
  select, import, and delete controls as the Reading Lab. The visible label is
  `Politeness`, not `Register`.

Listening interactions:

- Japanese text begins hidden.
- `Play all`
- `Stop`
- Play an individual sentence.
- `Show text`
- Playback speed:
  - `0.5×`
  - `0.75×`
  - `1×`
  - `1.25×`
- `I’m done listening — show questions`
- Questions also appear when the complete text finishes.

Comprehension interactions:

- `EN` shows or hides English prompts and answer translations.
- Select one answer per question.
- Review immediate correct/incorrect feedback.
- View the final score.

Learning behavior:

- The comprehension quiz is graded locally.
- Its result does not currently update spaced-repetition mastery.

Source:

- `japanese_knowledge_graph`

## 6. Japanese Karaoke / Read-Aloud Lab

Generation and library controls:

- Uses the same generated-text controls and saved-text library as Read and
  Listen.

Speaking interactions:

- `Start reading`
- `Stop`
- Read the displayed Japanese aloud.
- Recognized words highlight in sequence.
- After approximately five seconds without progress:
  - Kanji receives a kana hint.
  - Kana receives a rōmaji hint.
- `Skip word`
- `Translation`
- `Restart`
- View the completion message.

Learning behavior:

- Practices pronunciation and read-aloud fluency.
- The activity is ungraded and does not update mastery.
- Speech recognition requires Chrome or Edge.
- Local matching is supplemented by server-side phonetic matching.

Source:

- `japanese_knowledge_graph`

## 7. Tutor Chat

This canonical function has two modes rather than two duplicate chat modules.

### Course Q&A mode — Ask Sage

Availability and context:

- Opens from course, lecture, and topic pages.
- Receives the course title and up to 30 topic titles/summaries.

Interactions and buttons:

- `Open study assistant`
- `Close study assistant`
- Type in `Ask a question…`.
- Press Enter or click `Send message`.
- View `Thinking…` during streaming.
- Read Markdown explanations.
- Request generated flashcards, quick quizzes, key facts, or visual modules.
- Use the normal interactions inside generated cards.

### Japanese conversation mode

Scenario controls:

- `Daily life`
- `Restaurant`
- `Travel`
- `School`
- `Shopping`
- `Custom topic`
- `New`
- Select or delete an existing conversation.

Conversation interactions:

- Type Japanese, English, or rōmaji.
- Press Enter to send.
- Press Shift+Enter for a new line.
- Tutor and learner turns render as clearly bounded, oppositely aligned speech
  bubbles.
- `Furigana` toggles readings without changing message geometry.
- The empty composer shows a muted placeholder and a combined
  microphone/waveform voice affordance.
- Focusing the textarea reuses the composer's existing boundary and never adds
  another border or focus ring.
- Once the composer contains text, that stable right-side slot becomes a send
  arrow.
- `Record speech` / `Stop listening`
- `Voice` toggles automatic tutor-audio playback.
- Play individual tutor sentences.
- Receive a streaming tutor response.
- `Delete`

Analysis interactions:

- `Analyze`
- Review:
  - Conversation summary
  - Recurring error patterns
  - Original and corrected examples
  - Explanation notes
  - Practice targets
  - Suggested drills
  - Suggested next prompts
- Open a suggested drill in a practice session.

Learning behavior:

- Ask Sage is contextual course help and on-demand module generation.
- Japanese Chat practices open-ended language use.
- Conversation analysis suggests practice but does not directly reduce mastery.

Sources:

- `common_sage_frontend`
- `japanese_knowledge_graph`

## 8. Japanese Placement Assessment

Purpose:

- Finds a conservative starting level across kana, vocabulary, kanji, and
  grammar before building daily lessons.

Interactions and buttons:

- `Start placement`
- `Resume placement`
- Answer 24–40 adaptive questions.
- Use the standard Japanese drill-card controls.
- Keep each active drill card horizontally centered beneath the placement
  progress and uncertainty summary.
- `I don’t know—teach me`
- View answered count and per-dimension progress.
- `Pause and return later`
- `Skip placement for now`
- View:
  - Conservative working JLPT level
  - Per-dimension level band
  - Uncertainty
  - Estimated familiar concepts
- `Start guided lesson`
- `Retake`

Deduplication note:

- Placement reuses the assessment card types in Part 3. Those card renderers are
  not duplicated here.

Source:

- `japanese_knowledge_graph`

# Part 2 — Learning cards for an infinite-scroll view

These modules primarily explain, illustrate, or let the learner explore a
concept. Each can appear as one card in the Adaptive Course Study Feed.

## Shared learning-card behavior

- Scroll inside a long card.
- Open `Source ↗` in a new tab when supplied.
- Show `Sourced from your material` for source-grounded content.
- Show `Includes external references` for reference/web-grounded content.
- The feed can attach:
  - `Hard`
  - `Easy`
- Hard/Easy is reversible until the learner leaves the card.
- Passive cards can also receive a time-derived engagement score when no
  explicit score is selected.
- These cards normally influence topic progress but do not directly advance
  FSRS scheduling.

## 1. Explanation / Overview Card

Consolidated IDs and formats:

- `text`
- `description`
- Plain non-visual `summary`

Study content:

- Topic title and optional subtitle
- Structured Markdown or explanatory body
- Definitions
- Progressive explanation
- Concrete examples
- Closing takeaway
- Optional inline image

Interactions:

- Scroll and read.
- Use links embedded in Markdown.
- `Source ↗` when supplied.
- Feed-level `Hard` / `Easy`.

Sources:

- Module Factory
- Worker
- Frontend
- Backend

## 2. Stat Boxes

Canonical ID:

- `stat_boxes`

Study content:

- Grid of important numerical facts
- Value, unit, label, and optional qualifier/note

Interactions:

- `Source ↗`
- Feed-level `Hard` / `Easy`.

Best use:

- Measurements, populations, dates, distances, temperatures, speeds, and other
  memorable quantitative facts.

## 3. Key-Value Pairs

Canonical ID:

- `key_value_pairs`

Study content:

- Featured facts
- Attribute names and values
- Optional units and notes
- Additional grouped detail

Interactions:

- `[number] more detail`
- `[number] more details`
- `Show less`
- `Source ↗`
- Feed-level `Hard` / `Easy`.

## 4. Timeline

Canonical ID:

- `timeline`

Study content:

- Chronologically ordered dates, events, and descriptions

Interactions:

- Read the sequence.
- `Source ↗`
- Feed-level `Hard` / `Easy`.

Deduplication note:

- This is the passive learning timeline. The graded Timeline Ordering Exercise
  appears once in Part 3.

## 5. Common Mistakes

Canonical ID:

- `common_mistakes`

Study content:

- `Common Mistakes`
- `Wrong`
- `Right`
- Misconception and corrected understanding
- Optional context note

Interactions:

- Fully expanded, read-only comparison.
- Feed-level `Hard` / `Easy`.

## 6. Comparison vs Similar

Canonical ID:

- `comparison_vs_similar`

Study content:

- `Easily Confused With`
- Topic-versus-similar-concept tables
- Confusion explanation
- Comparison dimensions
- `Key difference`

Interactions:

- Horizontally scroll a wide table.
- Feed-level `Hard` / `Easy`.

Implementation note:

- Generated by the worker/Module Factory tool and rendered by the main
  frontend.
- The Module Factory preview package itself does not currently include its own
  React renderer.

## 7. Conversion Calculator

Canonical ID:

- `conversion_calculator`

Study content:

- Source unit and symbol
- Conversion groups
- Factors and optional offsets
- Live converted values

Interactions:

- Enter or edit a decimal value.
- Results update immediately.
- Clear the input.
- View `Enter a valid number` for invalid input.
- `Source ↗`
- Feed-level `Hard` / `Easy`.

Learning classification:

- Interactive production/support tool, but not automatically graded.

## 8. Input/Output Balance

Canonical ID:

- `input_output_balance`

Study content:

- `Inputs`
- `Outputs`
- Process equation
- Names, symbols, quantities, categories, and notes
- Optional balance or energy classification

Interactions:

- Read the process balance.
- `Source ↗`
- Feed-level `Hard` / `Easy`.

## 9. Formula / Equation

Canonical ID:

- `formula_equation`

Study content:

- Formula name
- LaTeX expression
- Variables, descriptions, and units
- Optional context

Interactions:

- `Copy LaTeX` or `LaTeX`
- Confirmation: `Copied!`
- Horizontally scroll an oversized expression.
- `Source ↗`
- Feed-level `Hard` / `Easy`.

## 10. Diagram / Schematic

Canonical ID:

- `diagram_schematic`

Supported layouts:

- Flowchart
- Tree
- Network
- Cycle

Interactions:

- Hover a node to highlight it and its direct relationships.
- View its description near the pointer.
- Click a node to keep it selected.
- Click it again to clear selection.
- Unrelated nodes dim.
- Relationship flow animates.
- Feed-level `Hard` / `Easy`.

## 11. Globe Pin / Geographic Explorer

Canonical ID:

- `globe_pin`

Study content:

- Map
- Geographic pins
- Country/territory highlights
- Routes
- Region labels
- Legend

Rich renderer interactions:

- Drag to pan.
- Scroll or pinch to zoom.
- Click a pin to open its label and description.
- `Close popup`
- Press Escape or click elsewhere to close the popup.
- Open `OpenStreetMap` attribution.
- `Source ↗`

Current main-frontend limitation:

- The copied frontend renderer currently shows a place list, description, and
  coordinates rather than the full interactive map.

## 12. Hero Image Gallery

Canonical ID:

- `hero_image`

Study content:

- One to three images
- Alt text
- Attribution and optional licence
- Image counter

Interactions:

- `Previous image`
- `Next image`
- `Image 1`, `Image 2`, etc. gallery-dot buttons
- Navigation wraps.
- View loading skeleton and failure fallback.
- Feed-level `Hard` / `Easy`.

Generation behavior:

- Can use images extracted from course PDFs.
- Can use permitted external reference images.

## 13. 3D Model Viewer

Canonical ID:

- `model_3d`

Study content:

- GLB or STL model
- Description
- Thumbnail fallback
- Attribution and optional licence

Rich renderer interactions:

- Automatic rotation.
- Drag to rotate.
- Scroll or pinch to zoom.
- `Loading 3D model…`
- Thumbnail fallback after rendering failure.

Current main-frontend limitation:

- The copied frontend renderer offers `View 3D model ↗` instead of embedding
  the interactive viewer.

## 14. Media Player Card

Consolidated variants:

- `audio`
- `video`

Audio content and interactions:

- Audio recording
- Optional transcript
- Browser play/pause, seek, volume, and playback controls
- Uses no eager preloading

Video content and interactions:

- Optional thumbnail
- Video
- Optional transcript
- Browser play/pause, seek, volume, fullscreen, and playback controls
- Uses metadata-only preloading

Shared interactions:

- Feed-level `Hard` / `Easy`.

Current generation status:

- Frontend and backend support both formats.
- The current worker advertises audio and video steps but both handlers are
  stubs, so it does not generate new media.

## 15. Topic Card / Composite Topic Overview

Canonical ID:

- `topic_card`

Study content:

- Topic and optional topic type
- Up to two visual modules
- Collapsible explanatory panels
- Unified source list

Supported nested visual modules:

- 3D Model
- Globe Pin
- Hero Image
- Diagram / Schematic

Supported nested content modules:

- Explanation
- Stat Boxes
- Key-Value Pairs
- Formula / Equation
- Timeline
- Input/Output Balance
- Common Mistakes

Interactions:

- Scroll the content area.
- Click a panel heading to expand or collapse it.
- Use every interaction belonging to its nested modules.
- Open unified sources such as `Wikipedia` or `Wikimedia Commons`.
- Feed-level `Hard` / `Easy`.

Deduplication note:

- Topic Card is a layout/orchestration module. The embedded modules above
  remain the same canonical modules and are not new copies.

# Part 3 — Assessment and exercise module cards

These modules require retrieval, selection, production, ordering, or another
checkable response. They are suitable as individual cards in the infinite feed
or inside the full-page session runner.

## Shared Japanese drill-card behavior

Applicable Japanese cards share:

- A 72% theme surface with shared backdrop blur; nested answer rows do not
  stack additional blur layers.
- `I don’t know—teach me`
- `Check`
- Press Enter to check when a valid response is ready.
- Tab and Shift+Tab navigate controls.
- A constant-width `Furigana` toggle only when optional ruby data exists and
  the reading is not the answer. Readings hide without changing card size,
  line breaks, or the position of any neighbouring content.
- `Continue`
- Correct answer marked in the existing option; an incorrect pick is marked
  in place without adding a verdict row. Correct uses the canonical frontend
  green fill and stronger green border; incorrect uses the canonical frontend
  red fill and stronger red border.
- Explanation
- Accepted variants
- Important contrast
- Context example
- Source links
- Mastery result
- `Report grading issue`

Validated Japanese drill answers update mastery and FSRS scheduling. Wrong
answers can also distribute evidence across related concepts.

## 1. Flashcard

Canonical ID: `flashcard`. Legacy `flashcard_set` is accepted only as an input
alias; sets use the same ID with a `cards` sequence.

Shared interaction:

- View a question or recall prompt.
- Reveal the answer.
- Return to the question.
- Move between cards when rendered as a set.

Japanese graded variant:

- `Show answer`
- Space or Enter reveals the answer.
- `Turn to front`
- Review answer, reading, details, and examples.
- Rate:
  - `Again · 1`
  - `Hard · 2`
  - `Good · 3`
  - `Easy · 4`
- Press keys 1–4.
- `Undo [rating] (5 seconds)`

Generic feed variant:

- Click/tap or press Space to flip.
- `Tap to flip`
- `Hard`
- `Easy`

Set/navigation variant:

- `Reveal answer`
- `Back to question`
- `Prev`
- `Next`
- `Previous card`
- `Next card`
- `Go to card [number]`
- Navigation wraps and resets the new card to its front.

Chat variant:

- `Click to reveal answer`
- Click again to hide it.
- Each card reveals independently.

Deduplication result:

- These are presentation and grading modes of one retrieval card, not four
  separate module concepts.

## 2. Multiple-Choice Quiz

Canonical ID: `quiz`. Legacy `mcq` and `kana_recognition` are accepted only as
input aliases. Chat-generated quizzes use the same ID.

Core interaction:

- Select one option.
- Selection remains reversible until `Check`.
- Correct lights green with a checkmark.
- After a mistake, the selected option lights red and the correct option
  lights green with a checkmark.
- Feedback never appends a row or resizes the card.

Single-question feed controls:

- Automatically score correct = `1`, incorrect = `0`.
- `Continue`; the machine-generated score is not followed by a difficulty
  self-rating.

Multi-question controls:

- `Next`
- `See Results`
- View number correct and percentage.
- Result messages:
  - `Perfect score!`
  - `Great job!`
  - `Good effort!`
  - `Keep practising!`
- Review per-question results and correct answers.
- `Try Again`
- `Source ↗`

Chat variant:

- Locks each question independently.
- Has no retry, aggregate score, or mastery recording.

## 3. Japanese Choice Drill Family

Shared interaction shell:

- View a prompt.
- Select one answer.
- `I don’t know—teach me`
- `Check`
- Review the correct answer and explanation.
- `Continue`

Registered skill variants:

### Kana Recognition — canonical `quiz`

- Kana symbol → rōmaji sound.

### Discrimination — `discrimination`

- Distinguish visually or functionally confusable items.

### Kanji Meaning — `kanji_meaning`

- Kanji → meaning.

### Kanji Readings — `kanji_reading`

- Kanji → bundled on’yomi and kun’yomi readings.

### Vocabulary Recognition — `vocab_recognition`

- Japanese word → English meaning.
- Reveals a Japanese example sentence and translation.

### Grammar Recognition — `grammar_recognition`

- Japanese grammar point → meaning or function.

Deduplication result:

- These pedagogical variants reuse the canonical choice-card interaction
  instead of duplicating UI descriptions.

## 4. Japanese Typed Production Family

Shared interaction shell:

- View a production prompt.
- Type the Japanese response.
- Kana and accepted rōmaji are supported where applicable.
- `I don’t know—teach me`
- `Check`
- Review the correct response and accepted variants.
- `Continue`

Registered variants:

### Particle Play — `particle_cloze`

- The sentence and input form one continuous horizontal line.
- Type the missing particle directly into the sentence.
- The candidate bank remains available as an optional hint.

### Vocabulary Production — `vocab_production`

- English meaning → typed Japanese word.
- Supports accepted kana aliases.
- Reveals an example sentence and translation.

### Conjugation Drill — `conjugation`

- Japanese verb + requested form → typed conjugation.
- Forms include:
  - Polite ます
  - Polite negative ません
  - Polite past ました
  - Plain past た
  - Plain negative ない
  - て-form
- `Show furigana`
- `Hide furigana`

## 5. Spoken Vocabulary Production

Canonical ID:

- `vocab_guess`

Study interaction:

- View an English meaning.
- Say the Japanese word.
- `Record`
- `Listening…`
- `Stop`
- `Try again`
- Review the recognizer's kana interpretation.
- Type the reading when speech recognition is unavailable.
- `I don’t know—teach me`
- `Check`
- Review the target word and reading.
- `Continue`

Technical behavior:

- Uses fuzzy pronunciation matching.
- Speech recognition requires Chrome or Edge.

## 6. Sentence Scramble

Canonical ID:

- `sentence_scramble`

Study interaction:

- View a translation and shuffled Japanese chunks.
- Tap chunks in the intended order.
- Tap a placed chunk to remove it.
- Place every chunk before checking.
- `I don’t know—teach me`
- `Check`
- Review the correctly ordered sentence.
- `Continue`

Skill:

- Japanese syntax and word order.

## 7. Audio Transcription

Canonical ID:

- `transcription`

Study interaction:

- Listen to a complete Japanese sentence.
- Audio may begin automatically.
- `Play`
- `Pause`
- `Loading…`
- `Retry audio`
- Type the sentence.
- `I don’t know—teach me`
- `Check`
- Review the correct transcription.
- `Continue`

Skill:

- Spoken Japanese sentence → written Japanese.

## 8. Map Click Quiz

Canonical ID:

- `map_click_quiz`

Question types:

- Point/location
- Country/polygon

Rich renderer interactions:

- Drag to pan.
- Scroll or pinch to zoom.
- Click to place or change a point.
- Click to select or change a country.
- `Check Answer`
- Review:
  - Correct location
  - Selected location
  - Distance error in a compact map toast
  - Selected and correct country
  - Per-answer grade
- `Next`
- `See Results`
- View final grade, pass status, and per-question results.
- `Try Again`
- `Source ↗`

Composition:

- The label-free map is twice the ordinary response-map height.
- There is no candidate list and no baked-in place-label layer.
- The map is a conventional Leaflet raster map using Esri's blue World Ocean
  Base without its separate reference-label layer. The theme's background blue
  remains the loading and gap colour. No SVG substitute, colour tint, blend
  layer, or grayscale filter is permitted.
- Keyboard users pan/zoom and press `Enter` to place the map centre.
- Checking ends with `Continue`, not an Easy/Hard rating.

Grading:

- Supports partial credit for point distance.
- Default Module Factory configuration uses the Swiss 1–6 scale.

Current main-frontend limitation:

- Its copied renderer currently provides `Reveal answer` and `Reset` without a
  clickable map or automatic geography score.

Current mastery limit:

- The backend registry marks this as a graded production module.
- The present Summary interaction path does not yet pass its module-specific
  grade into FSRS end to end.

## 9. Timeline Ordering Exercise

Canonical ID:

- `timeline_drag_exercise`

Study interaction:

- View shuffled events between `Earlier` and `Later`.
- Drag and drop an event to reorder it.
- `Move "[event]" up`
- `Move "[event]" down`
- `Check Order`
- View correct/incorrect position markers.
- View `[score] / [total] correct`.
- `Shuffle`
- `Try Again`
- `Show Answer`
- Showing the answer sorts the events and reveals dates.
- `Shuffle Again`
- `✓ All correct!`
- `Source ↗`

Current mastery limit:

- The backend registry marks this as a graded production module.
- The present Summary interaction path does not yet pass its module-specific
  grade into FSRS end to end.

# Canonical module summary

## Full-page functions

1. Japanese Daily Lesson
2. Adaptive Course Study Feed
3. Knowledge Graph / Concept Explorer
4. Japanese Reading Lab
5. Japanese Listening Lab
6. Japanese Karaoke / Read-Aloud Lab
7. Tutor Chat
8. Japanese Placement Assessment

## Infinite-scroll learning cards

1. Explanation / Overview
2. Stat Boxes
3. Key-Value Pairs
4. Timeline
5. Common Mistakes
6. Comparison vs Similar
7. Conversion Calculator
8. Input/Output Balance
9. Formula / Equation
10. Diagram / Schematic
11. Globe Pin / Geographic Explorer
12. Hero Image Gallery
13. 3D Model Viewer
14. Media Player
15. Topic Card / Composite Topic Overview

## Assessment and exercise card families

1. Flashcard
2. Multiple-Choice Quiz
3. Japanese Choice Drills
4. Japanese Typed Production
5. Spoken Vocabulary Production
6. Sentence Scramble
7. Audio Transcription
8. Map Click Quiz
9. Timeline Ordering Exercise

The nine assessment families preserve all 18 distinct registered exercise
variants while sharing repeated interaction shells. Across all three parts,
the result is 32 canonical product modules/functions with repository duplicates
removed.
