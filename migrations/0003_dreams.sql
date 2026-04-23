-- Dream engine table
CREATE TABLE IF NOT EXISTS dreams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dream_date TEXT NOT NULL,
  content TEXT NOT NULL,
  emotional_seed TEXT,
  fragments TEXT,
  recurring_dream_id INTEGER,
  recurrence_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(dream_date);
CREATE INDEX IF NOT EXISTS idx_dreams_recurring ON dreams(recurring_dream_id);
