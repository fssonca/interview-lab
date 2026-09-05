# Implementation plan

1. Define a strict JSON Schema and independent TypeScript domain types. Validate structure, unique IDs/options, and answer membership with actionable file/question paths.
2. Build pure scoring, shuffling, configuration, and session transitions. Persist a versioned snapshot with selected questions, option order, drafts, submitted answers, position, and absolute timestamps.
3. Discover topic JSON files with Vite's glob import. Validate on startup/build and in the browser. Add Python, PostgreSQL, and HTTP banks.
4. Build responsive topic, configuration, quiz, and results screens. Practice reveals submitted answers; exams reveal answers only on completion. Explicit skipping is supported.
5. Test domain rules and invalid banks, then exercise critical browser flows including refresh and expiry. Run types, lint, tests, and production build.

## Architecture and states

React + TypeScript + Vite, with no server or database. Files are the content source, localStorage is the single-device session store, and an absolute deadline survives refresh/background tabs. Browser storage is fallible: failures are visible. This is a study tool, so answers ship to the browser and timing is not tamper-proof.

UI states: library → configuration → active session → results. An active session may be answering or showing practice feedback. Its snapshot includes topic metadata and complete questions, so editing a bank doesn't alter an existing quiz. A finished snapshot retains the latest results.

Domain models: Question (discriminated union), QuestionBank, QuizConfig, QuizSession, Answer (string, string array, boolean, or null), Score. Session changes go through pure transitions, with time checked at every transition and on timer/visibility events.

## Schema contract

One JSON object per topic: required `id`, `name`, nonempty `questions`; optional `description` and `$schema`. Each question has a unique `id`, `type`, and nonempty `question`; optional `explanation` and `topics`. Unknown fields fail validation to catch mistakes.

- `single`: at least two unique string options, with one string `answer` matching an option.
- `multiple`: at least two unique string options, with a nonempty unique string `answers` array whose values all match options. Full set equality earns one point; no partial credit.
- `boolean`: a JSON boolean `answer`, with no options.

The machine-readable draft-07 schema lives at `schemas/question-bank.schema.json`. Semantic checks supplement JSON Schema for references and unique question/topic IDs. New types require extending the schema, domain union, answer controls, and scoring, without changing the page flow.
