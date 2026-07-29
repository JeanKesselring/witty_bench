# Module Factory — Study Modules and Interactions

This document includes only Module Factory modules that currently render
educational material students can directly study or interact with.

The inventory is based on the live React components in
`Modules/module-factory`, including the description module used by Topic Card.

## Shared interactions

Depending on the module, students can:

- Read generated educational content.
- Open a `Source ↗` link in a new browser tab.
- Expand or collapse additional information.
- Navigate images or flashcards.
- Manipulate maps, diagrams, and 3D models.
- Enter values and receive calculated results.
- Answer questions and receive immediate feedback.
- Retry an exercise.
- Review scores, corrections, explanations, and correct answers.

## 1. Description / Overview

Study content:

- Topic title
- Optional subtitle
- Explanatory body text

Interactions:

- No buttons or active controls.
- Students read the explanation directly.
- When used inside Topic Card, the surrounding content panel can be expanded
  or collapsed.

## 2. Stat Boxes

Study content:

- Topic title
- Optional subtitle
- A grid of key quantitative facts
- Large value
- Optional unit
- Fact label
- Optional qualifier or note

Interactions:

- `Source ↗` — opens the supporting source when supplied.
- Otherwise, this is a read-only study module.

Study purpose:

- Memorizing important numbers, measurements, populations, distances,
  temperatures, speeds, dates, or other quantitative facts.

## 3. Key-Value Pairs

Study content:

- Topic title and optional subtitle
- Featured facts
- Attribute names and values
- Optional units and notes
- Additional groups of detailed facts

Interactions:

- `[number] more detail`
- `[number] more details`
- `Show less`
- Expand the detailed grouped facts.
- Collapse the detailed grouped facts.
- `Source ↗`

Study purpose:

- Reviewing taxonomies, properties, biographical details, country facts,
  definitions, and other structured attributes.

## 4. Timeline

Study content:

- Topic title and optional subtitle
- Chronologically ordered events
- Date
- Event label
- Optional event explanation

Interactions:

- `Source ↗`
- Otherwise, this is a read-only chronological study module.

Study purpose:

- Understanding historical order, biographies, scientific discoveries, and
  process development over time.

## 5. Common Mistakes

Study content:

- `Common Mistakes`
- Number of included mistakes
- `Wrong` column
- `Right` column
- Incorrect belief or approach
- Correct replacement understanding
- Optional context note

Interactions:

- No buttons or collapsible sections.
- Every mistake is displayed fully expanded.

Study purpose:

- Contrasting common misconceptions with the correct understanding.

## 6. Conversion Calculator

Study content:

- Topic and unit name
- Unit category and optional description
- Primary unit symbol
- Alternative units grouped into sections
- Live converted values

Interactions:

- Click or focus the numeric input.
- Enter an integer or decimal value.
- Edit or clear the value.
- Results update immediately for every configured unit.
- Invalid input shows `Enter a valid number`.
- Large or very small results are formatted automatically.
- `Source ↗`

Study purpose:

- Practising relationships between units of length, mass, temperature, speed,
  energy, pressure, volume, time, and other linear unit families.

## 7. Input/Output Balance

Study content:

- Topic title and optional subtitle
- `Inputs`
- `Outputs`
- Input and output counts
- Names, symbols, quantities, categories, and notes
- Optional process equation
- Optional balance classification:
  - Endothermic
  - Exothermic
  - Balanced
  - Other
- Optional energy value, unit, efficiency, and explanation

Interactions:

- `Source ↗`
- Otherwise, this is a read-only process study module.

Study purpose:

- Understanding what enters and leaves a biological, chemical, or physical
  process.

## 8. Formula / Equation

Study content:

- Formula name
- Topic
- Rendered mathematical or chemical formula
- Variable symbols
- Variable descriptions
- Optional units
- Optional contextual explanation

Interactions:

- `LaTeX` — copies the raw formula to the clipboard.
- After a successful copy, the button temporarily displays `Copied!`.
- Open the displayed source URL when supplied.
- Horizontally scroll an oversized formula.

Study purpose:

- Learning equations, variable meanings, units, and the context in which a
  formula is used.

## 9. Diagram / Schematic

Supported diagram types:

- Flowchart
- Tree
- Network
- Cycle

Study content:

- Labelled nodes
- Directional edges
- Optional edge labels
- Optional node descriptions
- Animated relationship flow

Interactions:

- Hover a node to highlight it.
- Hovering displays the node’s description near the pointer.
- Click a node to select it.
- Click the selected node again to clear selection.
- Selecting a node highlights its direct relationships.
- Unconnected nodes are visually dimmed.

Study purpose:

- Exploring structures, systems, relationships, hierarchies, processes, and
  cycles.

## 10. Globe Pin

Study content:

- Interactive geographic map
- Modern or historical borders
- Point-of-interest pins
- Region labels
- Highlighted countries or territories
- Route arcs
- Colour legend

Interactions:

- Drag the map to pan.
- Scroll or pinch to zoom.
- Click a city or point pin.
- A pin popup can show:
  - Location label
  - Colour marker
  - Description
- `Close popup`
- Press Escape to close the popup.
- Click elsewhere on the map to close the popup.
- Open the `OpenStreetMap` attribution link.
- `Source ↗`

Study purpose:

- Studying locations, countries, territories, historical borders, journeys,
  battles, migration, and geographic relationships.

## 11. Hero Image

Study content:

- One to three images illustrating the topic
- Image alternative text
- Current-image counter

Interactions:

- `Previous image`
- `Next image`
- Select `Image 1`, `Image 2`, or `Image 3` using the gallery dots.
- Images wrap from the first to the last and from the last to the first.
- A loading skeleton appears while an image loads.
- A fallback appears if an image cannot be loaded.

Study purpose:

- Visual identification and contextual illustration of the topic.

## 12. 3D Model

Study content:

- Interactive GLB or STL model when available
- Thumbnail fallback if the model cannot be rendered
- Attribution and optional licence

Interactions:

- The model rotates automatically.
- Drag to rotate the model manually.
- Scroll or pinch to zoom.
- Zoom is constrained to the supported viewing range.
- Panning is disabled.
- Loading state: `Loading 3D model…`
- If rendering fails, the module shows the model thumbnail instead.

Study purpose:

- Inspecting anatomy, fossils, archaeological objects, mechanical structures,
  and other physical subjects from different angles.

## 13. Flashcard Set

Study content:

- Topic title and optional subtitle
- Card counter, such as `2 / 10`
- Question
- Optional hint
- Answer
- Difficulty label:
  - Easy
  - Medium
  - Hard

Interactions:

- Click the card to reveal the answer.
- Click the card again to return to the question.
- Press Enter or Space to flip the focused card.
- `Reveal answer`
- `Back to question`
- `Prev`
- `Next`
- `Previous card`
- `Next card`
- Select a card directly using its progress dot:
  - `Go to card 1`
  - `Go to card 2`
  - And so on
- Moving to another card returns it to the question side.
- Navigation wraps between the first and last cards.
- `Source ↗`

Study purpose:

- Self-directed retrieval practice.

Learning effect:

- The module does not currently ask for a recall rating.
- It does not display a score or update a mastery model by itself.

## 14. Multiple-Choice Quiz

Study content:

- Topic and optional subtitle
- Five to ten questions when generated normally
- Four answer options per question
- Question difficulty
- Question progress
- Optional answer explanation

Interactions:

- Select one answer.
- The answer locks after selection.
- Immediate feedback identifies:
  - Correct selected answer
  - Incorrect selected answer
  - Correct answer when the selection was wrong
- Feedback displays:
  - `Correct!`
  - `Incorrect`
- Review the question explanation when supplied.
- `Next`
- `See Results`
- Results display:
  - Number correct
  - Percentage
  - `Perfect score!`
  - `Great job!`
  - `Good effort!`
  - `Keep practising!`
  - Per-question correct or incorrect state
  - Correct answers for missed questions
- `Try Again`
- Retrying returns to the first question and clears previous answers.
- `Source ↗`

Study purpose:

- Testing conceptual recognition and factual understanding.

## 15. Map Click Quiz

Question types:

- Point question — click a geographic location.
- Country question — click a country polygon.

Study content:

- Topic and optional subtitle
- Instructions
- Question progress
- Optional hint
- Interactive map
- Per-question and final grading

Interactions:

- Drag the map to pan.
- Scroll or pinch to zoom.
- Hover countries to highlight them.
- Click the map to place a point marker.
- Click a country to select it.
- Click again to change the point or country selection.
- `Check Answer`
- After checking:
  - The correct location is displayed.
  - Incorrect and correct locations are visually distinguished.
  - The map moves toward the correct answer.
  - Point answers show distance from the target.
  - Country answers identify the selected and correct countries.
  - A per-answer grade is displayed.
- `Next`
- `See Results`
- Results display:
  - Final grade
  - Correct-answer count
  - Passed or not passed
  - Per-question result
  - Distance error
  - Selected country and correct country
  - Per-question grade
- `Try Again`
- `Source ↗`

Default grading:

- Uses a configurable numeric scale.
- The default configuration uses the Swiss 1–6 grading system.
- Near misses can receive partial credit based on distance.

Study purpose:

- Geography retrieval, spatial memory, country identification, and location
  accuracy.

## 16. Timeline Drag Exercise

Study content:

- Topic and optional subtitle
- Exercise instruction
- Shuffled event cards
- `Earlier` and `Later` timeline ends
- Event label and optional description
- Dates hidden until the answer is revealed

Interactions:

- Drag an event card to a new position.
- Drop it between other events.
- Move each event using:
  - `Move "[event]" up`
  - `Move "[event]" down`
- Arrow buttons provide keyboard and touchscreen alternatives to dragging.
- `Check Order`
- Correct positions receive a check mark.
- Incorrect positions receive an X.
- View the number of correctly positioned events.
- `Shuffle`
- `Try Again`
- `Show Answer`
- Showing the answer:
  - Places every event in chronological order.
  - Reveals each event’s date.
- After a perfect result:
  - `Shuffle Again`
  - `✓ All correct!`
- `Source ↗`

Study purpose:

- Practising chronology, historical sequences, process steps, and ordered
  development.

## 17. Topic Card

Study content:

- Topic name
- Optional topic type
- Up to two visual modules in the left column:
  - 3D Model
  - Globe Pin
  - Hero Image
  - Diagram / Schematic
- Content panels in the right column:
  - Description
  - Stat Boxes
  - Key-Value Pairs
  - Formula / Equation
  - Timeline
  - Input/Output Balance
  - Common Mistakes
- Unified source list

Interactions:

- Scroll the content column.
- Click a content-panel heading to expand it.
- Click it again to collapse it.
- Every panel reports whether it is expanded.
- Later panels can start collapsed by default.
- Use all interactions belonging to the embedded visual module.
- Use all interactions belonging to the embedded content module.
- Open unified source links such as:
  - `Wikipedia`
  - `Wikimedia Commons`
  - Other source-domain names

Study purpose:

- Combining multiple complementary representations of one topic in a single
  study workspace.

## Current exclusions

The following Module Factory directories are not included as directly usable
student study modules:

- `comparison_vs_similar` — currently has a generator, schema, example, and
  metadata, but no React `Component.tsx` renderer.
- `trellis` — generation infrastructure used to create 3D assets, not a
  student-facing study module.
- Preview, API, cache, benchmark, schema, and generator utilities — development
  infrastructure rather than study interactions.
