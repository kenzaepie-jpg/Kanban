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

   Move topics with the buttons or by drag and drop. The reader tracks your **reading progress** as you scroll (use the slider for PDFs). The course percentage updates live.
5. **WIP limit: 2 courses.** At most two courses can be on the board at once. A course leaves the board only when **all** its topics are done, which frees its slot for the next course.

### Also included
- Light (white & blue) and dark mode
- Optional **break reminder**: after 30 minutes on the study board it suggests a 5-minute break (toggle it under *Preferences*)
- Per-topic notes and study time
- A one-click sample course for trying the app

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # type-check
npm run build
```

## Where data is stored

There is no backend yet, so everything stays **in the browser**:

- Accounts live in `localStorage`, with passwords salted and hashed (PBKDF2-SHA-256).
- Courses, topics and progress are saved per user in `localStorage`.
- Uploaded files are saved in IndexedDB, so large PDFs don't hit the localStorage limit.

This means accounts don't sync between browsers or devices. Sign-in uses the Web Crypto API, so open the app on `localhost` or over HTTPS.

## Project structure

```
src/
├── App.tsx                  # Auth gate + workspace state (board rules, WIP limit, break reminder)
├── types.ts                 # User, Course, Topic, UserData
├── lib/
│   ├── auth.ts              # Register / login / logout
│   ├── fileStore.ts         # IndexedDB storage for uploaded files
│   ├── fileParser.ts        # PDF / Word / text parsing
│   ├── progress.ts          # WIP_LIMIT, progress %, course state
│   ├── topics.ts            # Building topics from uploads
│   ├── sampleCourse.ts      # Demo course
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
