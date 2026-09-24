-- GO STUDY database schema (MySQL 8+).
-- The server runs this automatically on start; you can also run it by hand in MySQL Workbench.

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  level           VARCHAR(30)   NOT NULL,
  password_hash   VARCHAR(100)  NOT NULL,
  break_reminder  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login sessions. Only a SHA-256 hash of the cookie token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  CHAR(64)      NOT NULL PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  expires_at  DATETIME      NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A course is on the study board while on_board_at is set (WIP limit: 2 per user).
CREATE TABLE IF NOT EXISTS courses (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED  NOT NULL,
  title         VARCHAR(200)  NOT NULL,
  code          VARCHAR(30)   NOT NULL DEFAULT '',
  color         CHAR(7)       NOT NULL DEFAULT '#2563eb',
  on_board_at   DATETIME(3)   NULL,
  completed_at  DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_courses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Topics are the Kanban cards. Uploaded files live on disk; only their path is stored here.
CREATE TABLE IF NOT EXISTS topics (
  id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  course_id        INT UNSIGNED  NOT NULL,
  title            VARCHAR(300)  NOT NULL,
  position         INT           NOT NULL,
  status           ENUM('course', 'in-process', 'done') NOT NULL DEFAULT 'course',
  progress         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  notes            TEXT          NULL,
  seconds_studied  INT UNSIGNED  NOT NULL DEFAULT 0,
  started_at       DATETIME      NULL,
  completed_at     DATETIME      NULL,
  file_name        VARCHAR(255)  NULL,
  file_path        VARCHAR(255)  NULL,
  file_type        ENUM('pdf', 'docx', 'text', 'markdown', 'html') NULL,
  file_size        INT UNSIGNED  NULL,
  CONSTRAINT fk_topics_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT chk_topics_progress CHECK (progress <= 100),
  INDEX idx_topics_course (course_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
