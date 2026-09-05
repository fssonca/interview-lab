# Interview Lab

A focused technical interview study app. Pick a topic, configure a practice session or exam, and review the reasoning behind every answer.

Includes **36 questions across Python, PostgreSQL, and HTTP / REST APIs**. Everything runs locally: no accounts, backend, database, or environment variables.

## Run locally

Use **Node.js 24 LTS** (or Node.js 26+) and npm. An `.nvmrc` is included for `nvm use`.

```bash
npm install
npm run dev
```

Open the local URL Vite prints, normally **http://127.0.0.1:5173**.

```bash
npm run build       # Validate banks, type-check, and build dist/
npm run preview     # Serve the production build locally
```

The production output is a static site. Deploy `dist/` to a static host. For a subdirectory deployment, set Vite's `base` option before building. There are no server routes or API calls. Fonts are included in the build.

## Study flow

Use the theme switch in the top bar to choose light or dark mode. The app follows your system preference until you make a choice, then remembers that choice in this browser. Changing themes preserves the current quiz and its timer.

1. Choose any discovered topic.
2. Choose **Practice** (feedback after each submitted answer) or **Exam** (feedback only after completion).
3. Choose a question count: available presets, all questions, or a custom count.
4. Optionally set a total duration of **1–180 whole minutes**.
5. Answer each question, or explicitly choose **Skip question**. Skipping clears that question's draft and records it as unanswered.
6. Review your percentage, correct/incorrect/unanswered counts, elapsed time, and every answer. **To revisit** filters the review to incorrect and unanswered questions.

Questions and string options are shuffled when the quiz starts. True/false choices retain their natural order. Multiple-choice questions use checkboxes and require an exact matching set: order doesn't matter, and extra or missing selections receive no credit. Single-choice and boolean questions require exact equality. Every question is worth one point. Percentage is rounded to the nearest whole number over **all** selected questions, including unanswered ones. Incorrect and unanswered are separate counts.

Practice answers lock after submission, so feedback cannot be used to change the recorded score. Exam answers advance on submission and stay hidden until completion. The initial version uses forward-only navigation.

## Refresh, timing, and persistence

The latest session is stored under `interview-lab.session.v1` in `localStorage`. Its versioned snapshot contains:

- Configuration and topic metadata.
- Complete selected questions, their randomized order, and randomized options.
- Current position, draft answers, and submitted-question IDs.
- Start time, absolute deadline, finish time, and completion reason.

Every answer selection is saved, including `false` and partially selected checkbox groups. Reloading resumes the active question or practice feedback. **Save & return to topics** retains the quiz and shows a resume card. Starting a new quiz replaces the previous session; the setup screen explicitly identifies an in-progress replacement. The latest results also survive refresh.

A timer checks the absolute deadline, rather than subtracting ticks. It checks on visibility/focus events and before every answer transition. If a tab is suspended or closed, expiry is applied when the browser runs again or the session is restored. Expired quizzes retain and score existing selections, including an unsubmitted current draft. Elapsed time stops at the deadline. A refresh never grants a fresh duration.

Storage data is validated before restoration. Invalid saved data produces a visible warning and can be replaced by starting a new session. If storage is blocked or full, the app remains usable and clearly warns that refresh recovery is unavailable.

Use one tab per quiz. This initial version retains one session per browser origin and does not synchronize concurrent tabs. Browser data clearing or switching devices/origins loses access to that snapshot. Client-side timing is suitable for studying, not proctoring: a user can change their clock/storage, and answer keys are present in the browser bundle.

## Add a topic

1. Add a JSON file directly inside `question-banks/`, such as `question-banks/redis.json`.
2. Give the bank an ID unique across all files and each question an ID unique within its bank.
3. Run `npm run validate:banks`.
4. Refresh the running development app. New files are discovered automatically; no imports, topic registry, or UI edits are needed. Restart Vite if your editor/filesystem watcher misses a file addition. Rebuild a production deployment to include content changes.

Example containing **all three supported types**:

```json
{
  "$schema": "../schemas/question-bank.schema.json",
  "id": "example",
  "name": "Example topic",
  "description": "A small bank demonstrating the supported question types.",
  "questions": [
    {
      "id": "example-001",
      "type": "single",
      "question": "Which method is defined as idempotent?",
      "options": ["POST", "PUT", "CONNECT"],
      "answer": "PUT",
      "explanation": "Repeated identical PUT requests have the same intended server effect as one request.",
      "topics": ["HTTP idempotency", "PUT vs POST"]
    },
    {
      "id": "example-002",
      "type": "multiple",
      "question": "Which methods are idempotent by specification?",
      "options": ["GET", "PUT", "POST", "DELETE"],
      "answers": ["GET", "PUT", "DELETE"],
      "explanation": "GET, PUT, and DELETE have idempotent semantics. POST has no general idempotency guarantee.",
      "topics": ["Idempotent methods", "Retries"]
    },
    {
      "id": "example-003",
      "type": "boolean",
      "question": "HTTP idempotency requires identical response status codes on every repeated request.",
      "answer": false,
      "explanation": "Idempotency describes the intended server effect, not identical responses.",
      "topics": ["Idempotency", "Response semantics"]
    }
  ]
}
```

### Schema rules

The authoritative structural schema is [`schemas/question-bank.schema.json`](schemas/question-bank.schema.json), using JSON Schema draft-07. Editors can use the optional `$schema` reference for completion and inline validation.

| Field               | Rules                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Bank `id`           | Required; lowercase letters/digits separated by single hyphens; globally unique.                       |
| Bank `name`         | Required, nonblank string.                                                                             |
| Bank `description`  | Optional, nonblank string.                                                                             |
| Bank `questions`    | Required, nonempty array.                                                                              |
| Question `id`       | Required; same ID syntax; unique within the bank.                                                      |
| Question `type`     | `single`, `multiple`, or `boolean`.                                                                    |
| Question `question` | Required, nonblank string. Plain text; line breaks are preserved.                                      |
| `options`           | Required for single/multiple; at least two unique, nonblank strings. Forbidden on boolean questions.   |
| `answer`            | Required for single (one exact option string) or boolean (JSON `true`/`false`). Forbidden on multiple. |
| `answers`           | Required for multiple; nonempty, unique array of exact option strings. Forbidden on other types.       |
| `explanation`       | Optional, nonblank string, displayed with feedback/results.                                            |
| `topics`            | Optional array of unique, nonblank strings, shown as selectable/copyable text with feedback/results.   |

Unknown fields fail validation, helping catch misspellings. Strings match exactly, including case and whitespace. JSON Schema validates structure; domain validation additionally checks answer membership, duplicate question IDs, and duplicate topic IDs. Structural errors include a filename and JSON path; semantic errors include the affected question. Invalid JSON, invalid questions, duplicate topics, and an empty bank directory are **errors**, never silently skipped.

Validation runs at development server startup, during production builds, in the browser loader, and through `npm run validate:banks`. The browser reads banks as raw text so JSON parsing errors can name the offending file.

**Authoring tip:** options must be safe to reorder. Avoid references such as “A and C,” “the previous option,” or “all of the above.” Use self-contained option text. Markdown/code rendering and additional metadata are intentionally left for future extensions; extend the schema and TypeScript types before adding new fields.

## Architecture

- **React + TypeScript:** component-based UI and a discriminated union for the three question types.
- **Vite:** local development and a static production bundle. [`import.meta.glob`](https://vite.dev/guide/features.html#glob-import) discovers the JSON banks.
- **Ajv:** compiles the shared [JSON Schema](https://ajv.js.org/guide/getting-started.html). Semantic rules supplement structural validation.
- **Pure domain functions:** scoring, shuffling, configuration validation, and timestamped session transitions are independent of React and storage.
- **localStorage adapter + React hook:** validated snapshots and visible storage errors, with no server infrastructure.
- **Vitest + Playwright:** domain/validation/storage tests and desktop/mobile Chromium integration tests.

```text
question-banks/                 One JSON file per topic
schemas/question-bank.schema.json
src/
  domain/
    types.ts                   Question, bank, config, session, answer, and score
    validation.ts              Structural and semantic bank validation
    quiz.ts                    Scoring, shuffling, and pure session transitions
    storage.ts                 Versioned snapshot validation and persistence
    *.test.ts                  Domain, validation, and persistence tests
  data/banks.ts                Automatic question-bank discovery
  hooks/useQuizSession.ts      React session state, persistence, deadline checks
  components/                 Library, configuration, quiz, results, shared UI
  App.tsx                     Screen navigation and shell
  main.tsx                    Bootstrap and visible bank-load failure
  styles.css                  Responsive styles
scripts/validate-banks.ts       Node-side validation CLI
tests/quiz.spec.ts              Browser integration tests
docs/architecture.md            Initial architecture and implementation plan
```

The flow is library → configuration → active quiz → results. Practice adds a feedback state within the active quiz. A session contains a copy of its questions, so a bank edit does not change an in-progress quiz.

To add a question type, extend the schema and discriminated union, add its answer controls and matching rules, and test it. Filtering/difficulty can be introduced before `createQuizSession`; history and statistics can build on finished session snapshots. A future storage adapter can replace localStorage without changing scoring. Mixed-topic sessions would need broader topic metadata but can reuse the question/scoring model.

## Checks

```bash
npm test                  # Unit tests: scoring, sessions, schemas, storage
npm run typecheck         # Strict TypeScript checking
npm run lint              # ESLint and React hook rules
npm run format:check      # Check consistent source formatting
npm run validate:banks    # Validate every question bank
npx playwright install chromium
npm run test:e2e          # Desktop + mobile browser flows
npm run build            # Complete production build
```

On Linux CI, install browser system dependencies with `npx playwright install --with-deps chromium`. The browser test runner starts its own local server on port 4173. Tests cover all question types, practice feedback, exam answer secrecy, scoring and skipped answers, restored selections and feedback, deadline preservation, automatic expiry, corrupted/unavailable storage, and resuming from the library. Test traces are retained on failure in the ignored `test-results/` directory.

## Seed content references

Questions are original development fixtures based on these primary references:

- Python: [data structures](https://docs.python.org/3/tutorial/datastructures.html) and [functions/default arguments](https://docs.python.org/3/tutorial/controlflow.html).
- PostgreSQL: [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) and [constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).
- HTTP: [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html).

The banks emphasize stable fundamentals; recheck version-specific claims when expanding them.
