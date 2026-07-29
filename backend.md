# Common Sage Backend — Study Functionality and Interactions

This inventory covers backend behavior that directly shapes a learner's study
session in `common_sage_backend`. The backend has no buttons of its own; the
listed buttons belong to the frontend behavior that calls these services.

## 1. Adaptive next-content queue

Learner entry points:

- `Start learning` for a course lecture
- `Start learning` for a topic
- Content filters: `Mixed`, `Flashcards`, `Quizzes`, `Learning`

Backend behavior:

- Selects an appropriate lecture when the learner did not choose one.
- Prefers non-mastered topics.
- Ranks topics by course relevance and lower current understanding.
- Normally focuses on the three highest-ranked topics.
- Widens the search when those topics have no queueable content.
- Supports explicit lecture and topic scoping.
- Avoids content seen by the learner during the last seven days.
- Returns at least three and at most ten items when enough content exists.
- Targets roughly ten minutes of expected study time.
- Uses these expected durations:
  - Flashcard: 30 seconds
  - Quiz: 45 seconds
  - Text: 180 seconds
  - Audio: 240 seconds
  - Video: 300 seconds
  - Summary/visual module: 120 seconds
- Interleaves review and new material.
- Caps reviews at approximately half of a mixed session while both streams
  remain available.
- Reports whether this is the learner's onboarding session.

## 2. Queueable study content

Supported resource types:

- Flashcard
- Quiz
- Text
- Audio
- Video
- Summary, including visual and exercise modules

Visibility behavior:

- The adaptive queue accepts content with `waiting`, `approved`, or `corrected`
  status.
- Content dismissed or outside those states is not queued.

## 3. Interaction recording

Recorded learner actions:

- Content type
- Content UUID
- Duration in seconds
- Optional normalized score from `0` to `1`
- Visit date

Frontend controls that can supply a score:

- `Hard` sends `0`.
- `Easy` sends `1`.
- Quiz selection initially sends incorrect = `0`, correct = `1`.

When no explicit score is supplied:

- The backend estimates a score from time spent divided by the expected duration
  for that content type.
- The inferred score is clamped to `0–1`.

Storage behavior:

- Each study event is immutable.
- The event is connected to the learner and the studied module.

## 4. Topic progress

Learner-visible results:

- `Not started`
- `[number]% progress`
- `[explored] / [total] topics explored`

Backend statuses:

- `needs_review` when understanding is below `0.5` or accuracy below `0.6`
- `mastered` when understanding is at least `0.85` and accuracy at least `0.8`
- `in_progress` otherwise

Scoring behavior:

- Flashcard and quiz evidence has full content-type weight.
- Passive text, audio, video, and summary evidence has `0.25` weight.
- Recent evidence receives more weight.
- Evidence up to seven days old receives full recency weight.
- Recency declines to half weight by day 30.
- Older evidence uses a `0.25` recency floor.

## 5. FSRS spaced repetition

Current learner-facing inputs:

- Flashcard `Hard` / `Easy`
- Quiz correct/incorrect result, optionally replaced by `Hard` / `Easy`

Grade mapping:

- Score below `0.5` → FSRS `Again`
- Score from `0.5` to below `0.85` → FSRS `Hard`
- Score `0.85` or above → FSRS `Good`
- A passing response under 2.5 seconds can become `Easy`

Scheduling behavior:

- Stores review count, stability, difficulty, due date, last review, FSRS state,
  and learning/relearning step.
- Treats never-reviewed concepts as due.
- Treats a concept as due when its recall estimate falls to the target retention
  or its due date passes.
- Prioritizes due and less-retrievable concepts in the next-content queue.

Current integration limit:

- The interaction write path currently advances FSRS only for
  resource-labelled `Flashcard` and `Quiz` items.
- The registry marks `timeline_drag_exercise` and `map_click_quiz` as graded,
  but those summary-carried module interactions do not currently reach the FSRS
  update path end to end.

## 6. Practice-mode ladder

The backend groups study modules into three levels and adjusts queue preference
as mastery stability grows.

### Recognition

- `flashcard`
- `quiz`
- `mcq`
- `flashcard_set`

### Production

- `timeline_drag_exercise`
- `map_click_quiz`
- `conversion_calculator`

### In context

- `text`
- `summary`
- `topic_card`
- `diagram_schematic`
- `input_output_balance`
- `stat_boxes`
- `key_value_pairs`
- `timeline`
- `common_mistakes`
- `comparison_vs_similar`
- `formula_equation`
- `hero_image`
- `globe_pin`
- `model_3d`

Rotation behavior:

- New or lightly reviewed concepts prefer recognition.
- Stability of at least three days prefers production.
- Stability of at least ten days prefers in-context material.
- Matching module types receive a ranking bonus rather than becoming an
  absolute requirement.

## 7. Course and topic scoping

Supported study choices:

- Whole-course study
- Lecture-scoped study
- Topic-scoped study

Behavior:

- Topic scope queues only the selected topic.
- Lecture scope prefers that lecture's non-mastered topics.
- Whole-course scope moves to the first lecture containing non-mastered topics.
- If every topic is mastered, the service falls back to available lecture
  material.

## 8. Content-type filtering

Frontend buttons and backend effect:

- `Mixed` — no type exclusions.
- `Flashcards` — keeps only Flashcard content.
- `Quizzes` — keeps only Quiz content.
- `Learning` — excludes Flashcard and Quiz API resource types; the frontend
  additionally removes visual exercise-module summaries.

## 9. Pillar proficiency

Study information calculated by the backend:

- Progress grouped by concept subtype instead of one course-wide score
- Total concepts
- Reviewed concepts
- Mastered concepts
- Mean stability
- Proficiency ratio
- Weakest started subtype

Behavior:

- A subtype the learner has never started is not labelled the weakest.
- This data is available for learning guidance, although the current frontend
  course study screen does not display a pillar panel.

## 10. Knowledge-graph study data

Backend contribution:

- Supplies courses, ordered lectures, topics, descriptions, keywords, and topic
  relationships used to build the frontend's course Knowledge Graph.
- Supplies topic progress used in course/topic study views.

Frontend interactions enabled by this data:

- `Knowledge graph`
- Click a parent, child, or deeper topic to change focus.
- Search topics and keywords.
- Expand/collapse the focused-topic sidebar.

