CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_or_artist_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    discord TEXT,
    contact_preference TEXT NOT NULL,
    project_description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    track_link TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);