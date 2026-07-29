# Common Sage Worker — Study Content Inventory

This inventory covers only outputs from `Common_Sage_Worker` that become
student study material. The worker has no learner-facing screen or buttons of
its own. Buttons and interactions happen after its output is rendered by the
frontend.

## Shared generation behavior

- Extracts source text, image captions, and topic evidence from uploaded course
  documents.
- Skips grounded content when a topic has no usable source evidence.
- Plans content per topic and avoids generating types excluded by the compiler
  plan.
- Chooses approximately 3–6 genuinely useful visual modules for most topics,
  with fewer when evidence is thin.
- Source-tier modules are grounded in uploaded course material.
- External reference modules are disabled by default and require the course's
  external-source setting or a per-module override.
- Generated modules carry provenance used by the frontend for:
  - `Sourced from your material`
  - `Includes external references`
- PDF images near a topic can become a source-grounded Hero Image module.

## 1. Flashcard

Generated study material:

- 5–10 self-contained question-and-answer cards per topic
- One concept per card
- Definition, cause/effect, example, and comparison prompts
- Concise one-to-three-sentence answers
- Relevance and difficulty scores

Learner interactions after rendering:

- Click/tap or Space to flip.
- `Hard`
- `Easy`

Status:

- Implemented in a dedicated worker step.

## 2. Quiz

Generated study material:

- Five multiple-choice questions per topic
- Four plausible options per question
- Exactly one correct option
- Relevance and difficulty scores

Learner interactions after rendering:

- Select one option.
- Review correct/incorrect highlighting.
- `Hard`
- `Easy`

Status:

- Implemented in a dedicated worker step.
- Invalid answer sets are rejected rather than published.

## 3. Text Explanation

Generated study material:

- Self-contained Markdown lesson
- Core idea and motivation
- Key definitions
- At least one example
- Closing summary

Learner interactions after rendering:

- Scroll and read.
- `Hard`
- `Easy`

Status:

- Implemented in a dedicated worker step.

## 4. Common Mistakes

Generated study material:

- Misconceptions, corrections, explanations, and examples grounded in source
  material

Learner interactions after rendering:

- Read the mistake/correction pairs.
- `Source ↗` when present.
- Deck-level `Hard` / `Easy`.

## 5. Comparison vs Similar

Generated study material:

- Side-by-side distinctions between a topic and easily confused concepts
- Comparison dimensions and key differences

Learner interactions after rendering:

- Horizontally scroll wide tables.
- Deck-level `Hard` / `Easy`.

## 6. Conversion Calculator

Generated study material:

- Unit conversion definitions with factors and optional offsets

Learner interactions after rendering:

- Enter a number and receive live conversion results.
- `Source ↗`
- Deck-level `Hard` / `Easy`.

Generation note:

- Reference-tier; requires permission for external references.

## 7. Diagram / Schematic

Generated study material:

- Flowchart, tree, network, or cycle with labelled nodes and relationships

Learner interactions after rendering:

- Hover or select nodes.
- Inspect descriptions and connected relationships.
- Deck-level `Hard` / `Easy`.

## 8. Formula / Equation

Generated study material:

- LaTeX formula, variable legend, units, and explanation

Learner interactions after rendering:

- `Copy LaTeX`
- `Source ↗`
- Deck-level `Hard` / `Easy`.

## 9. Input/Output Balance

Generated study material:

- Process inputs, outputs, quantities, and balance explanation

Learner interactions after rendering:

- Read the balance sheet.
- `Source ↗`
- Deck-level `Hard` / `Easy`.

## 10. Key-Value Pairs

Generated study material:

- Featured facts and grouped detailed attributes

Learner interactions after rendering:

- `[number] more detail(s)`
- `Show less`
- `Source ↗`
- Deck-level `Hard` / `Easy`.

## 11. Stat Boxes

Generated study material:

- Several important quantitative facts

Learner interactions after rendering:

- Read the statistic cards.
- `Source ↗`
- Deck-level `Hard` / `Easy`.

## 12. Timeline

Generated study material:

- Chronological dated events and explanations

Learner interactions after rendering:

- Read the event sequence.
- `Source ↗`
- Deck-level `Hard` / `Easy`.

## 13. Timeline Drag Exercise

Generated study material:

- Five-to-eight events or steps with a canonical order

Learner interactions after rendering:

- Drag to reorder.
- Move up/down buttons.
- `Check Order`
- `Shuffle`
- `Try Again`
- `Show Answer`
- `Shuffle Again`
- Deck-level `Hard` / `Easy`.

## 14. Hero Image

Generated study material:

- Topic image gallery, attribution, licence, and alt text
- Can use images extracted directly from the uploaded PDF

Learner interactions after rendering:

- Previous/next image arrows.
- Numbered gallery-dot buttons.
- Deck-level `Hard` / `Easy`.

Generation note:

- Externally resolved images are reference-tier.
- Images extracted from course PDFs are treated as source material.

## 15. Globe Pin

Generated study material:

- Named places, coordinates, and descriptions

Learner interactions in the current frontend:

- Read the pin list and coordinates.
- No interactive globe is currently rendered there.
- Deck-level `Hard` / `Easy`.

Generation note:

- Reference-tier.

## 16. Map Click Quiz

Generated study material:

- Geography identification questions
- Correct coordinates or country identifiers
- Optional hints and tolerances

Learner interactions in the current frontend:

- `Reveal answer`
- `Reset`
- No actual map click or geographic scoring is currently rendered.
- Deck-level `Hard` / `Easy`.

Generation note:

- Reference-tier.

## 17. 3D Model

Generated study material:

- Model description and externally sourced model URL

Learner interactions in the current frontend:

- `View 3D model ↗`
- The current frontend opens the model externally rather than embedding a 3D
  manipulation view.
- Deck-level `Hard` / `Easy`.

Generation note:

- Reference-tier.

## 18. Topic Card orchestration

Generated study material:

- One composed topic overview containing visual, study, and exercise modules
- Collapsible content sections
- Consolidated sources

Learner interactions after rendering:

- Expand or collapse each content panel.
- Use all nested module controls.
- Open consolidated source links.
- Deck-level `Hard` / `Easy`.

Status:

- Implemented by the worker's summary step through the Module Factory
  `topic_card` generator.
- The generic worker module registry does not list Topic Card as an independent
  classifier candidate.

## Not currently generated

### Audio

- The pipeline advertises an `audio` step.
- The handler only logs that generation is not implemented and skips it.
- No new student audio is produced by this worker.

### Video

- The pipeline advertises a `video` step.
- The handler only logs that generation is not implemented and skips it.
- No new student video is produced by this worker.

