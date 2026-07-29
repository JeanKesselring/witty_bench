# Common Sage Frontend — Study Functionality and Interactions

This inventory covers only functionality in `common_sage_frontend` that a
learner directly uses to study. Account, administration, authoring, moderation,
and course-management controls are excluded.

## 1. Course study hub

Study content:

- Course title and description
- `Lectures` tab
- `Topics` tab
- Student progress badge: `[explored] / [total] topics explored`
- Per-topic badge:
  - `Not started`
  - `[number]% progress`

Interactions and buttons:

- `Lectures` — shows the course's ordered lecture list.
- `Topics` — shows the course's topic list.
- `Start learning` on a lecture — opens a deck scoped to that lecture.
- `Start learning` on a topic — opens a deck scoped to that topic.
- `Knowledge graph` — opens the course concept graph.

## 2. Adaptive study deck

Study behavior:

- Presents a vertically scrolling feed of recommended course content.
- Shows deck position as `[current] / [loaded]`.
- Adds `+` to the count while more material is loading.
- Loads more content as the learner approaches the end.
- Records time spent when the learner leaves the active card.
- Records the latest selected score with the interaction.
- Very brief accidental views under 0.7 seconds are not recorded unless the
  learner supplied a score.
- Switching content type resets the queue and loads a new feed.

Content-filter buttons:

- `Mixed` — mixes all available study content.
- `Flashcards` — shows flashcards only.
- `Quizzes` — shows quizzes only.
- `Learning` — excludes flashcards, quizzes, and visual exercise modules,
  leaving explanatory study material.

General deck interactions:

- Scroll up or down to move between cards.
- Scroll inside long cards to read all content.
- Focus the deck with the keyboard.
- `Hard` — records score `0`.
- `Easy` — records score `1`.
- A Hard/Easy choice can be changed while the card remains active.
- Choosing a score does not automatically advance the deck.

## 3. Flashcard

Study content:

- Front: question or recall prompt
- Back: answer or explanation

Interactions and buttons:

- Click or tap the card to flip it.
- Press Space to flip the active card, unless focus is in another interactive
  control.
- `Tap to flip`
- `Hard`
- `Easy`
- Hard/Easy controls appear after the answer is revealed.
- Flip back to the question by clicking or tapping again.

## 4. Multiple-choice quiz

Study content:

- One question
- A list of answer options
- Exactly one generated correct answer in normal worker output

Interactions and buttons:

- Click one answer option.
- The first answer locks the question; later answer clicks do nothing.
- The correct answer is highlighted.
- An incorrectly selected answer is highlighted separately.
- `Hard`
- `Easy`
- The automatically selected score is correct = `1`, incorrect = `0`.
- Hard/Easy can replace that score before the learner leaves the card.

## 5. Markdown explanation

Study content:

- Structured Markdown lesson
- Headings, emphasized concepts, examples, and summary
- Optional inline illustration

Interactions and buttons:

- Scroll to read long content.
- `Hard`
- `Easy`
- No answer checking.

## 6. Audio content

Study content:

- Audio recording
- Optional transcript

Interactions and buttons:

- Browser audio controls, including play/pause, seeking, volume, and any
  browser-provided playback options.
- Audio uses `preload="none"`.
- `Hard`
- `Easy`

## 7. Video content

Study content:

- Optional thumbnail
- Video
- Optional transcript

Interactions and buttons:

- Browser video controls, including play/pause, seeking, volume, fullscreen,
  and any browser-provided playback options.
- Video uses metadata-only preloading.
- `Hard`
- `Easy`

## 8. Visual module wrapper

Study behavior:

- Renders supported visual modules stored as summary content.
- Shows `Sourced from your material` for source-tier material.
- Shows `Includes external references` for reference/web-tier material.
- Hovering the attribution can expose its source-note tooltip when supplied.
- The whole summary card also has `Hard` and `Easy` deck scoring.
- Unsupported or invalid module data currently renders nothing.

## 9. Stat Boxes

Study content:

- Topic and optional subtitle
- Grid of numerical facts
- Values, units, labels, and optional qualifiers

Interactions and buttons:

- `Source ↗` when supplied — opens the source in a new tab.
- Otherwise read-only.

## 10. Key-Value Pairs

Study content:

- Featured facts
- Optional units and notes
- Optional grouped detail

Interactions and buttons:

- `[number] more detail`
- `[number] more details`
- `Show less`
- `Source ↗`

## 11. Timeline

Study content:

- Ordered dated events
- Event names and descriptions

Interactions and buttons:

- `Source ↗` when supplied.
- Otherwise read-only.

## 12. Common Mistakes

Study content:

- Common misconception or error
- Correction and explanation
- Optional example

Interactions and buttons:

- `Source ↗` when supplied.
- Otherwise read-only.

## 13. Comparison vs Similar

Study content:

- `Easily Confused With`
- Topic-versus-related-concept comparisons
- Optional reason for the confusion
- Scrollable comparison table by aspect
- `Key difference`

Interactions and buttons:

- Horizontally scroll a wide comparison table.
- No dedicated buttons.

## 14. Conversion Calculator

Study content:

- Source unit
- Conversion groups and target units
- Factors and optional offsets

Interactions and buttons:

- Enter a decimal number in the value field.
- Results update immediately while typing.
- Invalid input shows `Enter a valid number`.
- `Source ↗` when supplied.

## 15. Input/Output Balance

Study content:

- Inputs
- Central process
- Outputs
- Quantities, units, notes, and balance statement when supplied

Interactions and buttons:

- `Source ↗` when supplied.
- Otherwise read-only.

## 16. Formula / Equation

Study content:

- Topic and optional subtitle
- Rendered formula
- Variable legend and units
- Optional explanation

Interactions and buttons:

- `Copy LaTeX` icon button — copies the formula source to the clipboard.
- The button changes to a confirmation state after copying.
- `Source ↗` when supplied.

## 17. Diagram / Schematic

Study content:

- Flowchart, tree, network, or cycle
- Connected labelled nodes
- Optional edge labels
- Optional node descriptions

Interactions and buttons:

- Hover a node to highlight it and directly connected nodes.
- Hovering dims unrelated nodes.
- Hover a described node to show a floating description.
- Click a node to keep it selected.
- Click the selected node again to clear it.
- Flow indicators animate along connections.
- No text-labelled buttons.

## 18. Globe Pin

Current frontend behavior:

- Displays a topic and a list of named places.
- Displays each place's optional description.
- Displays latitude and longitude rounded to two decimals.
- Shows `Interactive map not available in this environment` if no valid pins
  exist.

Interactions and buttons:

- No map manipulation in this frontend implementation.
- No dedicated buttons.

## 19. Hero Image

Study content:

- One or more topic images
- Alt text
- Attribution and optional licence
- Image counter

Interactions and buttons:

- `Previous image` arrow
- `Next image` arrow
- `Image 1`, `Image 2`, etc. gallery-dot buttons
- Navigation wraps at the first and last image.
- Failed images show `No image available`.

## 20. 3D Model

Current frontend behavior:

- Displays the topic and model description.
- Does not embed a manipulable 3D viewer.

Interactions and buttons:

- `View 3D model ↗` — opens the external model URL in a new tab.

## 21. Map Click Quiz

Current frontend behavior:

- Displays geography questions, hints, and hidden answers.
- Despite the module name, this implementation does not include a clickable
  map or distance/country scoring.

Interactions and buttons:

- `Reveal answer` on each question.
- Click the revealed answer button again to hide it.
- `Reset` — hides every revealed answer.
- `Source ↗` when supplied.

## 22. Timeline Drag Exercise

Study content:

- Shuffled events or ordered process steps
- `Earlier` and `Later` orientation
- Optional event descriptions

Interactions and buttons:

- Drag and drop an item to reorder it.
- `Move "[event]" up`
- `Move "[event]" down`
- `Check Order`
- Correct and incorrect positions receive distinct feedback.
- `[score] / [total] correct`
- `Shuffle`
- `Try Again`
- `Show Answer` — places everything in correct order and reveals dates.
- `Shuffle Again`
- `✓ All correct!`
- `Source ↗` when supplied.

## 23. Topic Card

Study content:

- Topic and optional topic type
- Visual modules
- Collapsible content modules
- Description, statistics, facts, formula, timeline, balance, and common
  mistakes when supplied
- Consolidated source links

Interactions and buttons:

- Click a content panel's display name to expand it.
- Click it again to collapse it.
- Panel chevron communicates open/closed state.
- Use all controls belonging to nested modules.
- Source names such as `Wikipedia` or `Wikimedia Commons` open in new tabs.
- An unknown nested module shows `Module "[id]" not registered.`

## 24. Ask Sage study assistant

Availability:

- Floating chat button appears on course, lecture, and topic routes.
- Course routes pass the course title and up to 30 topic titles/summaries as
  context.

Interactions and buttons:

- `Open study assistant`
- `Close study assistant`
- Panel title: `Ask Sage`
- Type in `Ask a question…`.
- Press Enter or click `Send message`.
- Send is disabled for an empty message or while a response is streaming.
- `Thinking…` appears during generation.
- The conversation scrolls to the newest message.
- Assistant text renders as Markdown.

Chat-generated flashcard-set interactions:

- Click an individual card.
- `Click to reveal answer`
- Click again to hide the answer.
- Cards reveal independently.

Chat-generated quiz interactions:

- Select one option per question.
- The first selection locks that question.
- Correct answer and an incorrect selection receive distinct feedback.
- No retry, reset, score summary, or mastery recording is implemented inside
  the chat quiz.

Chat-generated visual modules:

- Uses the same supported visual renderers and nested interactions listed above.

## 25. Course Knowledge Graph

Study content:

- Course, lecture, and topic hierarchy
- Current focus node
- Parent, child, and deeper nodes
- Node title, summary, and keywords
- Legend explaining hierarchy roles

Interactions and buttons:

- Click a child or grandchild node to focus and zoom into it.
- Click the parent chip or parent connection to zoom out.
- Hover a visible node or label to show its title and shortened summary.
- `Search concepts…`
- Search matches titles and keywords and shows up to eight results.
- Click a search result to focus it.
- Press Enter to choose the first search result.
- Press Escape to clear and close the results.
- `Collapse sidebar`
- `Expand sidebar`
- The sidebar shows the focused concept's full summary and keywords.

## 26. Topic content list

Outside the adaptive deck, a topic page can show its complete content list.

Study interactions:

- Read flashcard questions and already-visible answers.
- Read quiz questions and option text without submitting an answer.
- Read Markdown explanations.
- Use audio/video browser controls.
- Use all supported visual-module interactions.

Limit:

- Flashcards do not flip and quizzes are not graded in this list view; those
  interactions are available in the adaptive deck.

