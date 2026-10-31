# Concept Compass (v2)

Next.js 14 (App Router) + Tailwind + Framer Motion + React Flow. Supabase/PostgreSQL persistence is optional for local practice and required for cross-device learner history and class analytics.

## Run it (VS Code)

```bash
npm install
cp .env.example .env.local     # optional: add Supabase values
npm run dev
```

Open http://localhost:3000. Use the Account page to create an account or sign in. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env` or `.env.local` to enable Supabase Auth; the service-role key must remain server-only. Run the latest `supabase/schema.sql` in the Supabase SQL editor to enable cross-device learner history and reports, then restart the dev server.

## Learning system

The supported syllabus is CBSE Class 10 Science Physics units. The graph contains 35 prerequisite-linked concepts across Electricity, Magnetic Effects of Current, Light, and Human Eye & Colourful World. Every concept has at least eight server-answerable practice questions: curated questions are supplemented with concept-specific knowledge checks. Review and expand these items before deploying a high-stakes assessment.

| Request | Where it lives now |
|---|---|
| Chapter mock tests and per-test reports | `app/mock-tests/`, `app/api/mock-tests/route.ts`, `components/QuestionSimulator.tsx` |
| Eight-question, concept-focused practice from each Skill Map node | `app/practice/page.tsx`, `lib/question-bank.ts` |
| Feedback after every answer (right or wrong, plus the reason) | `app/diagnostic/page.tsx`, feedback block, and `lib/misconception.ts` |
| Diagnostic of 5 questions, with an option for 8 | `lib/config.ts` (`DIAGNOSTIC_OPTIONS`), `app/onboarding/page.tsx` |
| Report with chart, strengths, gaps, focus, roadmap, resources | `app/report/page.tsx`, `lib/report.ts`, `components/RadarChart.tsx`, `components/BarList.tsx` |
| Concept-linked interactive simulator on each learning question | `components/QuestionSimulator.tsx` |
| Night mode | `app/globals.css` (colour tokens), `components/ThemeToggle.tsx`, `app/layout.tsx` |
| Teacher class dashboard | `app/teacher/page.tsx`, protected data from `app/api/teacher/dashboard/route.ts` |

The diagnostic and practice screens request questions from the adaptive question API. Diagnostics cover new concepts first; general practice prioritizes due reviews, then weak concepts. Opening a Skill Map node starts an eight-question session locked to that concept, with distinct question IDs and a completion state before returning to the map. The server validates every answer and returns the answer key only after submission. Confidence adjusts the strength of the BKT evidence. Wrong-answer misconception tags are based on the student's written reasoning using reviewed rules; unmatched reasoning is explicitly marked unclassified rather than inferred by an LLM.

Each diagnostic, practice, and mock-test question has a concept-linked interactive simulator. **Mock tests** includes a weekly assignment plan: Monday–Thursday cover each syllabus chapter, Friday and Saturday revisit the learner's weakest chapters, and Sunday's 10-question comprehensive test samples all chapters. Chapter tests also contain 10 questions. After submission, the app shows a per-question score, answer review, misconception feedback, and mastery changes. Completed reports and assignment status are saved in that learner's browser storage.

## Where to edit (cheat sheet)

| I want to... | Open this file | What to change |
|---|---|---|
| Change the question bank | `lib/question-bank.ts` → `QUESTIONS` | Add reviewed question variants with difficulty, answer index, and reasoning-based misconception rules |
| Add a concept | `lib/concepts.ts` → `CONCEPTS` | Add `{ id, label, chapter, prereqs, remediation }`; add questions for it in the server-only question bank |
| Change diagnostic options (5 / 8) | `lib/config.ts` → `DIAGNOSTIC_OPTIONS` | e.g. `[5, 10]` |
| Change which simulator a chapter uses | `lib/config.ts` → `CHAPTERS[...].simulator` | `"circuit"`, `"magnet"` or `"light"` |
| Change reading resources | `lib/config.ts` → `CHAPTERS[...].resources` | Title, URL, and why it helps |
| Change the roadmap steps | `lib/report.ts` → `roadmap` | The three `steps` strings |
| Change the colours (day / night) | `app/globals.css` → `:root` and `.dark` | Change the RGB triplets |
| Change the landing text | `app/page.tsx` | Plain text in JSX |
| Change the mastery thresholds | `lib/report.ts` (0.75 strength, 0.55 gap) and `lib/bkt.ts` | Numbers |
| Change the simulators | `components/simulators/*.tsx` | Each file is one simulator |
| Change the database schema | `supabase/schema.sql` | Run the SQL again in Supabase |

## Backend responsibilities

- `GET /api/concepts` returns the syllabus graph, prerequisite edges, and question coverage.
- `POST /api/learners` enrolls a learner under the teacher-provided class code.
- `POST /api/questions` selects an unseen diagnostic concept or practice question, prioritizes due/weak concepts, calibrates difficulty, and never returns the answer key.
- `POST /api/mock-tests` creates a 10-question chapter or all-chapter test with calibrated difficulty, without exposing answer keys. Each submitted response is graded through `POST /api/answer`.
- `POST /api/answer` validates the selected option on the server, tags misconceptions from written reasoning, updates confidence-adjusted BKT mastery, and schedules the next review. With Supabase configured, the attempt and mastery update are committed atomically.
- `POST /api/reviews` returns due concepts from persisted mastery or the learner's local mastery snapshot. `GET /api/reviews?userId=<uuid>` supports persisted schedules.
- `/teacher` is password-gated and filters class-wide mastery gaps and misconception counts by class code. Login exchanges `TEACHER_DASHBOARD_KEY` for an HTTP-only cookie through `/api/teacher/login`.
- Learner accounts use Supabase email/password Auth. The browser session is persisted and refreshed by Supabase; learner API requests validate the access token and bind all writes to the authenticated user ID. Legacy local progress is moved to the first signed-in account and synchronized to the database when configured.

Question selection uses the server-only bank in `lib/question-bank.ts`; concept practice variants are built from each concept's syllabus remediation and never expose their answer keys to the browser. Students enter the same class code during onboarding that the teacher selects on the dashboard.

## Database (optional)

1. Create a Supabase project, open the SQL editor, run `supabase/schema.sql`.
2. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in Vercel). If upgrading from the earlier schema, rerun the updated script to create learner profiles and replace global teacher views with class-scoped views.
3. Set `TEACHER_DASHBOARD_KEY` to a long, random secret to enable the protected teacher data endpoint.

The service role key is used only by server-side API routes. It never reaches the browser. Without Supabase, learner progress and review scheduling work in that browser's local storage, but class-wide analytics and cross-device persistence are unavailable.

## Deploy (Vercel)

1. Push this folder to GitHub.
2. vercel.com → Add New → Project → import the repo.
3. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `TEACHER_DASHBOARD_KEY` under Environment Variables.
4. Deploy. Each push to `main` redeploys.

## Before the demo

- Check the reading links in `lib/config.ts` open correctly.
- Review the focused-practice question variants and simulator behavior for each concept in `lib/question-bank.ts` and `components/QuestionSimulator.tsx`.
- Check Wispr Flow's brand guidelines before using their logo. The footer is text-only for now.
- Run the full flow once: onboarding (use a class code) → diagnostic → report → practice/review → teacher dashboard (same class code).
