-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FOLDERS TABLE (Virtual directories)
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FILES TABLE
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  telegram_channel_id BIGINT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  encryption_salt TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_in_trash BOOLEAN NOT NULL DEFAULT false,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SHARES TABLE
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  download_count INT NOT NULL DEFAULT 0,
  allowed_downloads INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  telegram_message_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVITIES TABLE (Timeline logs)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('UPLOAD', 'DOWNLOAD', 'DELETE', 'RESTORE', 'SHARE', 'EDIT_NOTE')),
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- FILE_TAGS JOIN TABLE
CREATE TABLE IF NOT EXISTS file_tags (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (file_id, tag_id)
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'neon-cyberpunk' CHECK (theme IN ('neon-cyberpunk', 'midnight-glass', 'crimson-void', 'aurora-green', 'solar-gold')),
  telegram_bot_token TEXT,
  telegram_channel_id BIGINT,
  enc_key_salt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR FASTER QUERY SPEED
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_file ON shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_file ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag_id);
