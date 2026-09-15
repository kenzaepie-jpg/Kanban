# Exam Prep Kanban

A student study workflow web application designed to help you prepare for exams by organizing course topics, Word documents (`.docx`), and PDFs onto a sequential Kanban board.

## Features

- **3-Stage Kanban Board**:
  - **Not Done**: Backlog of topics, lecture notes, and documents awaiting your first study session.
  - **Reading & Active (Middle Stage)**: Active study zone. Clicking "Start Reading" shifts the card here and launches the study reader.
  - **Done & Mastered**: Completed topics. Moving topics here updates overall course completion metrics.
- **Sequential Document & PDF Study Flow**:
  - Built-in PDF reader with embed and download capabilities.
  - Formatted Word document viewer (`.docx` parsed with Mammoth).
  - **"Mark Done & Next Topic"** button: Completes the current topic, triggers celebratory feedback, automatically advances the next pending topic to the Reading column, and loads its document into the viewer.
- **Course & Exam Tracking**:
  - Real-time countdown to target exam dates.
  - Track mastered topic counts, completion percentages, and estimated study minutes.
  - Multi-course switcher with preloaded high-yield subjects (Biology, Distributed Systems, Constitutional Law).
- **Study Utilities**:
  - Focus study timer with pause and reset.
  - Topic key objectives checklist.
  - Exam confidence scoring (1–5 stars).
  - Personal study scratchpad with automatic local storage persistence.

---

## Project Structure

```
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Bundler configuration
├── index.html                     # HTML entry point
├── src/
│   ├── main.tsx                   # React root mount
│   ├── App.tsx                    # Main state management and Kanban auto-advance logic
│   ├── types.ts                   # TypeScript interfaces (Course, Topic, KanbanStatus)
│   ├── index.css                  # Global Tailwind styles
│   ├── data/
│   │   └── sampleCourses.ts       # Preloaded realistic courses and study documents
│   ├── utils/
│   │   └── fileParser.ts          # Word doc (.docx), PDF, and syllabus parser
│   └── components/
│       ├── Navbar.tsx             # Course switcher, exam countdown, and progress bar
│       ├── KanbanBoard.tsx        # 3-column Kanban board with drag-and-drop
│       ├── TopicCard.tsx          # Card component with priority badges and quick actions
│       ├── StudyReaderModal.tsx   # Reader suite with timer, PDF/doc viewer, and next topic flow
│       ├── UploadModal.tsx        # Word doc/PDF upload and syllabus importer
│       ├── AddTopicModal.tsx      # Quick modal to add custom topics
│       ├── CourseManagerModal.tsx # Manage and create courses with colors and exam dates
│       └── ExamCelebrationModal.tsx # 100% course completion celebration
```

---

## Getting Started Locally

1. **Clone or Extract the Repository**:
   ```bash
   git clone <your-github-repo-url>
   cd <project-folder>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Build for Production**:
   ```bash
   npm run build
   ```
