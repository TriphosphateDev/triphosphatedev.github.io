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