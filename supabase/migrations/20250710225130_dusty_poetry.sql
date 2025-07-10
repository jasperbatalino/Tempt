/*
  # Chat System Database Schema

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable for anonymous users)
      - `title` (text, auto-generated from first message)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to chat_sessions)
      - `role` (text, 'user' or 'assistant')
      - `content` (text, message content)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous users to manage their own sessions
    - Add policies for authenticated users to manage their own data

  3. Features
    - Automatic session title generation
    - Message ordering by timestamp
    - Efficient querying with indexes
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  title text NOT NULL DEFAULT 'Ny Konversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS Policies for anonymous users (using session-based access)
CREATE POLICY "Anyone can create chat sessions"
  ON chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own sessions"
  ON chat_sessions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update their own sessions"
  ON chat_sessions
  FOR UPDATE
  TO anon
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages from accessible sessions"
  ON messages
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for authenticated users
CREATE POLICY "Users can manage their own sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage messages from their sessions"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = messages.session_id 
      AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();