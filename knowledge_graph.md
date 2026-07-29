# Knowledge Graph Prototype — Study Functionality and Interactions

This inventory covers the standalone `knowledge_graph` repository. It is a
static study-oriented visualization prototype, separate from the newer graph
integrated into `common_sage_frontend`.

## 1. Concept graph exploration

Study content:

- Static topic hierarchy loaded from bundled JSON
- Current focus concept
- Parent concept
- Child concepts
- Grandchild/deeper concepts
- Concept title, summary, and keywords

Interactions:

- Click a child concept shape or label to focus it.
- Click a grandchild node to focus it.
- Click the parent label or thick parent connection to zoom out.
- Focus changes animate node position and scale.
- Hover visible concepts to show a floating preview.
- Moving the pointer updates the preview position.
- Leaving the graph hides the preview.

## 2. Hover preview

Study content:

- Placeholder preview image
- Concept title
- Summary shortened to approximately 90 characters

Interactions and buttons:

- Appears automatically on hover.
- Flips to the left of the cursor when it would overflow the viewport.
- Bookmark icon button is displayed.

Current limit:

- The bookmark icon has no click handler and does not save anything.

## 3. Focused-concept sidebar

Study content:

- Placeholder preview image
- Full concept title
- Full summary
- Keyword chips
- Static `Insights` bar chart

Interactions and buttons:

- `Collapse sidebar`
- `Expand sidebar`
- Bookmark icon button
- `Go to course`

Current limits:

- The bookmark icon has no click handler.
- `Go to course` has no click handler or destination.
- The Insights chart uses fixed placeholder values and is not learner progress.

## 4. Header

Displayed items:

- `Common Sage`
- Static user name and dropdown marker
- Static avatar

Current limit:

- The name/dropdown marker and avatar are not interactive.

## Not included

- No flashcards
- No quizzes
- No content deck
- No concept search
- No graph legend
- No progress or mastery updates
- No connection to live course/backend data

Those study features exist in the main frontend, backend, Module Factory, or
Japanese Knowledge Graph inventories instead.
