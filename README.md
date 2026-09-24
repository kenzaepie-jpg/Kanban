# GO STUDY

A study planner for students built on the **Kanban** principle: *stop starting, start finishing.*

## How it works

1. **Sign in or create an account.** Registration asks for your name, email, level and password.
2. **Dashboard.** It shows your profile (name, email, level, study stats, preferences) and the **COURSES** section. Add a course there and upload its topics: each PDF, Word (`.docx`), `.txt` or `.md` file becomes one topic. You can also type topic titles.
3. **Begin Study.** Pick the course you want to study now. It goes onto your **Study Board**.
4. **Study Board.** Each course gets its own Kanban lane with three columns:

   | COURSE | IN PROCESS | DONE |
   | --- | --- | --- |
   | Topics waiting to be studied | What you are reading now | Finished topics |

   Move topics with the buttons or by drag and drop. The reader tracks your **reading progress** automatically: PDFs page by page (25 pages → each page is 4%, shown in 5-page slide groups), Word and text files as you scroll. Topics without a file use a manual slider. The course percentage updates live, and PDFs reopen where you stopped.

   A topic can only be marked **Done** once it has been read to **100%**; the Done / Finish course buttons stay locked until then (the server enforces this too).
5. **WIP limit: 1 course at a time.** Add all your courses in the COURSES section, then press **Study** on one. Only that course is on the study board until you either **finish** all its topics or **end the session** (for example when priorities change). Ending a session keeps your progress, so you can resume the course later. Pressing Study on another course while one is active asks you to end the current session and switch.

### Also included
- Light (white & blue) and dark mode
- Optional **break reminder**: after 30 minutes on the study board it suggests a 5-minute break (toggle it under *Preferences*)
- Per-topic notes and study time
- A one-click sample course for trying the app

## Tech stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript (`server/`)
- **Database:** MySQL 8+ (tables in [`server/schema.sql`](server/schema.sql))
- **Files:** uploaded PDFs, Word and text files are saved in `uploads/`; the database stores only their paths

## Run locally

1. Install and start **MySQL 8 or newer**.
2. Copy `.env.example` to `.env` and set your MySQL password:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=gostudy
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev      # API on :4000 + website on http://localhost:3000
   ```
   On first start the server creates the `gostudy` database and its tables.

Other scripts:

```bash
npm run lint     # type-check frontend and backend
npm run build    # build the frontend into dist/
npm start        # production: one server on :4000 serving the API and the built site
```

## Database

| Table      | Holds |
| ---------- | ----- |
| `users`    | Name, email, level, bcrypt password hash, break-reminder setting |
| `sessions` | Login sessions (a SHA-256 hash of the httpOnly cookie token) |
| `courses`  | A student's courses; `on_board_at` is set while the course is on the study board |
| `topics`   | Kanban cards: column (`course` / `in-process` / `done`), reading progress, notes, study time, file info |

The server enforces the study rules in the database:
- **WIP limit.** Beginning a course locks the student's courses (`SELECT … FOR UPDATE`) and refuses a second active course (HTTP 409), unless the request asks to switch, which ends the current session in the same transaction.
- **Completion.** When the last topic of a course on the board is done, the course is marked complete and leaves the board.
- **Read to the end.** A topic can only move to Done once its progress is 100% (HTTP 409 otherwise).
- **Ownership.** Topics can only be moved while their course is on the board, and every query is scoped to the signed-in student.

## API

All routes except `/api/auth/*` need the session cookie.

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/api/auth/register` | Create account `{name, email, level, password}` |
| POST | `/api/auth/login` | Sign in `{email, password}` |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current student |
| GET | `/api/data` | All courses, topics, board and settings |
| PATCH | `/api/settings` | `{breakReminder}` |
| POST | `/api/courses` | Create a course (multipart: `title`, `code`, `color`, `titles`, `files[]`) |
| POST | `/api/courses/sample` | Add the sample course |
| POST | `/api/courses/:id/topics` | Add topics (multipart: `titles`, `files[]`) |
| POST | `/api/courses/:id/begin` | Start studying the course (WIP limit 1); `{switch: true}` ends the current session first |
| POST | `/api/courses/:id/end` | End the course's study session early (progress is kept) |
| POST | `/api/courses/:id/restart` | Reset a course's progress |
| DELETE | `/api/courses/:id` | Delete a course, its topics and files |
| PATCH | `/api/topics/:id` | Save `{progress, notes}` |
| POST | `/api/topics/:id/move` | Move to a column `{status}` |
| POST | `/api/topics/:id/done-next` | Mark done and start the next topic |
| POST | `/api/topics/:id/time` | Add study time `{seconds}` |
| POST | `/api/topics/:id/file` | Attach a file (multipart: `file`) |
| GET | `/api/topics/:id/file` | Download the topic's file |
| DELETE | `/api/topics/:id` | Delete a topic |

## Project structure

```
server/
├── index.ts         # Express app: API routes, serves dist/ in production
├── config.ts        # Settings from .env
├── db.ts            # MySQL pool, auto-creates database + schema
├── schema.sql       # Table definitions
├── auth.ts          # Register / login / logout, session middleware
├── study.ts         # Courses, topics, uploads, WIP limit, completion rules
├── sampleCourse.ts  # Demo course content
└── http.ts          # Error handling helpers
src/
├── App.tsx                  # Session check, workspace state, calls to the API
├── types.ts                 # User, Course, Topic, UserData
├── lib/
│   ├── api.ts               # fetch wrapper
│   ├── auth.ts              # Auth API calls
│   ├── fileParser.ts        # Renders PDF / Word / text files in the reader
│   ├── progress.ts          # WIP_LIMIT, progress %, course state
│   ├── theme.ts             # Light / dark mode
│   └── useStudyClock.ts     # Session timer for break reminders
└── components/
    ├── AuthPage.tsx         # Sign in / create account
    ├── Header.tsx           # Navigation, theme toggle, logout
    ├── Dashboard.tsx        # Profile, preferences, COURSES section
    ├── CourseModals.tsx     # Add course, manage course, begin study
    ├── StudyBoard.tsx       # Kanban lanes: Course → In Process → Done
    ├── ReaderModal.tsx      # Document reader with progress tracking and notes
    ├── BreakModal.tsx       # 30-minute break reminder
    ├── CompletionModal.tsx  # Course finished celebration
    └── common.tsx           # Modal, progress bar, file drop, toast, logo
```
